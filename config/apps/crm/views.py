from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.common.viewsets import AuditModelViewSet
from apps.common.permissions import IsStaffOrAdmin
from apps.customers.models import Customer
from django.contrib.auth.models import User

from .models import (
    Lead, Activity, FollowUp, Tag, LeadTag, CustomerTag, LeadStatusHistory,
    Account, Contact, Deal, Quote, QuoteLineItem
)
from .serializers import (
    LeadSerializer,
    LeadListSerializer,
    LeadStatusHistorySerializer,
    ActivitySerializer,
    FollowUpSerializer,
    TagSerializer,
    AccountSerializer,
    ContactSerializer,
    DealSerializer,
    QuoteSerializer,
)

# Status transition rules — only these forward moves are allowed
VALID_TRANSITIONS = {
    "NEW":       ["CONTACTED", "QUALIFIED", "LOST"],
    "CONTACTED": ["QUALIFIED", "LOST"],
    "QUALIFIED": ["CONVERTED", "LOST"],
    "CONVERTED": [],        # terminal
    "LOST":      ["NEW"],   # allow re-opening
}


def is_admin_user(user):
    """Check if user has admin/staff privileges."""
    if user.is_superuser or user.is_staff:
        return True
    try:
        role = (user.profile.role_title or "").lower()
        return role in ("admin", "administrator", "super admin", "manager")
    except Exception:
        return False


# ─────────────────────────────────────────────
# TAG
# ─────────────────────────────────────────────
class TagViewSet(AuditModelViewSet):
    queryset = Tag.objects.all().order_by("name")
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]


# ─────────────────────────────────────────────
# LEAD
# ─────────────────────────────────────────────
class LeadViewSet(AuditModelViewSet):
    queryset = Lead.objects.all().select_related("assigned_to", "converted_customer").order_by("-created_at")
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "phone", "email", "company"]

    def get_serializer_class(self):
        if self.action == "list":
            return LeadListSerializer
        return LeadSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user

        # ── Role-based scoping ────────────────────────────────────────────────
        # Admin / manager / is_staff  →  see ALL leads
        # Everyone else               →  see ONLY leads assigned to them
        if not is_admin_user(user):
            qs = qs.filter(assigned_to=user)

        # ── Query-param filters ───────────────────────────────────────────────
        status_param    = self.request.query_params.get("status")
        source          = self.request.query_params.get("source")
        intent          = self.request.query_params.get("intent")
        assigned_to     = self.request.query_params.get("assigned_to")
        date_from       = self.request.query_params.get("date_from")
        date_to         = self.request.query_params.get("date_to")
        follow_up_today = self.request.query_params.get("follow_up_today")
        my_leads        = self.request.query_params.get("my_leads")

        if status_param:
            qs = qs.filter(status=status_param.upper())
        if source:
            qs = qs.filter(source=source.upper())
        if intent:
            qs = qs.filter(intent=intent.upper())
        # Admins can filter by any user; non-admins ignored (already scoped)
        if assigned_to and is_admin_user(user):
            if assigned_to == "unassigned":
                qs = qs.filter(assigned_to__isnull=True)
            else:
                qs = qs.filter(assigned_to_id=assigned_to)
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        if follow_up_today == "true":
            qs = qs.filter(follow_up_date=timezone.now().date())
        if my_leads == "true":
            qs = qs.filter(assigned_to=user)

        return qs

    def perform_update(self, serializer):
        """Auto-create status history when status changes."""
        old_status = self.get_object().status
        new_status = self.request.data.get("status", old_status)

        # Validate transition
        if new_status != old_status:
            allowed = VALID_TRANSITIONS.get(old_status, [])
            if new_status not in allowed:
                from rest_framework.exceptions import ValidationError
                raise ValidationError(
                    f"Invalid status transition: {old_status} → {new_status}. "
                    f"Allowed: {allowed or ['none']}"
                )

        instance = serializer.save(updated_by=self.request.user)

        if new_status != old_status:
            LeadStatusHistory.objects.create(
                lead=instance,
                from_status=old_status,
                to_status=new_status,
                changed_by=self.request.user,
                note=self.request.data.get("status_note", ""),
            )

    # ── Convert lead → customer ──────────────────
    @action(detail=True, methods=["post"])
    @transaction.atomic
    def convert(self, request, pk=None):
        lead = self.get_object()

        if lead.status == "CONVERTED":
            return Response(
                {"error": "Lead is already converted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        customer = Customer.objects.create(
            name=lead.name,
            phone=lead.phone,
            email=lead.email,
            address=lead.address,
            customer_type="company" if lead.company else "individual",
            company_name=lead.company if lead.company else "",
            created_by=request.user,
        )

        # Zoho CRM Conversion: Create Account, Contact, and Deal
        account = None
        if lead.company:
            account = Account.objects.create(
                name=lead.company,
                phone=lead.phone,
                address=lead.address,
                assigned_to=lead.assigned_to,
                created_by=request.user,
            )

        contact = Contact.objects.create(
            account=account,
            first_name=lead.name.split(" ")[0],
            last_name=" ".join(lead.name.split(" ")[1:]) if " " in lead.name else "",
            email=lead.email,
            phone=lead.phone,
            assigned_to=lead.assigned_to,
            created_by=request.user,
        )

        deal = Deal.objects.create(
            name=f"{lead.company or lead.name} - Opportunity",
            account=account,
            contact=contact,
            amount=lead.budget,
            expected_laptops=lead.expected_laptops,
            stage="VALUE_PROPOSITION",
            assigned_to=lead.assigned_to,
            created_by=request.user,
        )

        old_status = lead.status
        lead.converted_customer = customer
        lead.status = "CONVERTED"
        lead.save()

        LeadStatusHistory.objects.create(
            lead=lead,
            from_status=old_status,
            to_status="CONVERTED",
            changed_by=request.user,
            note=f"Converted to Customer, Account, Contact, and Deal (Deal ID: {deal.id})",
        )

        return Response(
            {
                "message": "Lead successfully converted to Customer, Contact, Account, and Deal.",
                "customer_id": customer.id,
                "deal_id": deal.id,
                "contact_id": contact.id,
            },
            status=status.HTTP_200_OK,
        )

    # ── Status history ───────────────────────────
    @action(detail=True, methods=["get"], url_path="status-history")
    def status_history(self, request, pk=None):
        lead = self.get_object()
        history = lead.status_history.all()
        return Response(LeadStatusHistorySerializer(history, many=True).data)

    # ── Add tag ──────────────────────────────────
    @action(detail=True, methods=["post"], url_path="add-tag")
    def add_tag(self, request, pk=None):
        lead = self.get_object()
        tag_id = request.data.get("tag_id")
        try:
            tag = Tag.objects.get(id=tag_id)
        except Tag.DoesNotExist:
            return Response({"error": "Tag not found."}, status=status.HTTP_404_NOT_FOUND)
        LeadTag.objects.get_or_create(lead=lead, tag=tag)
        return Response({"message": f"Tag '{tag.name}' added."})

    # ── Remove tag ───────────────────────────────
    @action(detail=True, methods=["post"], url_path="remove-tag")
    def remove_tag(self, request, pk=None):
        lead = self.get_object()
        tag_id = request.data.get("tag_id")
        LeadTag.objects.filter(lead=lead, tag_id=tag_id).delete()
        return Response({"message": "Tag removed."})

    # ── Assign a lead to a user (admin only) ─────
    @action(detail=True, methods=["post"], url_path="assign")
    def assign(self, request, pk=None):
        if not is_admin_user(request.user):
            return Response({"error": "Only admins can assign leads."}, status=status.HTTP_403_FORBIDDEN)
        
        if "user_id" not in request.data:
            return Response({"error": "user_id is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        lead = self.get_object()
        user_id = request.data.get("user_id")
        
        if user_id is None or user_id == "" or user_id == 0:
            # Unassign
            lead.assigned_to = None
            lead.save(update_fields=["assigned_to"])
            
            # Log unassignment
            LeadStatusHistory.objects.create(
                lead=lead,
                from_status=lead.status,
                to_status=lead.status,
                changed_by=request.user,
                note=f"Unassigned by {request.user.get_full_name() or request.user.username}",
            )
            return Response({"message": "Lead unassigned.", "assigned_to": None, "assigned_to_name": None})
            
        try:
            user = User.objects.get(id=user_id, is_active=True)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
            
        lead.assigned_to = user
        lead.save(update_fields=["assigned_to"])
        
        LeadStatusHistory.objects.create(
            lead=lead,
            from_status=lead.status,
            to_status=lead.status,
            changed_by=request.user,
            note=f"Assigned to {user.get_full_name() or user.username} by {request.user.get_full_name() or request.user.username}",
        )
        return Response({
            "message": f"Lead assigned to {user.get_full_name() or user.username}.",
            "assigned_to": user.id,
            "assigned_to_name": user.get_full_name() or user.username,
        })

    # ── Bulk assign leads (admin only) ───────────
    @action(detail=False, methods=["post"], url_path="bulk-assign")
    def bulk_assign(self, request):
        if not is_admin_user(request.user):
            return Response({"error": "Only admins can assign leads."}, status=status.HTTP_403_FORBIDDEN)
        lead_ids = request.data.get("lead_ids", [])
        user_id  = request.data.get("user_id")
        if not lead_ids:
            return Response({"error": "lead_ids is required."}, status=status.HTTP_400_BAD_REQUEST)
        if user_id:
            try:
                user = User.objects.get(id=user_id, is_active=True)
            except User.DoesNotExist:
                return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
            assigned_to = user
        else:
            assigned_to = None  # unassign
        updated = Lead.objects.filter(id__in=lead_ids).update(assigned_to=assigned_to)
        return Response({"message": f"{updated} lead(s) updated.", "updated_count": updated})

    # ── Pipeline summary ─────────────────────────
    @action(detail=False, methods=["get"], url_path="pipeline")
    def pipeline(self, request):
        stages = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"]
        data = {}
        # Respect role-based scoping
        base_qs = self.get_queryset()
        for stage in stages:
            qs = base_qs.filter(status=stage)
            data[stage] = {
                "count": qs.count(),
                "leads": LeadListSerializer(qs[:5], many=True).data,
            }
        return Response(data)

    # ── Today's follow-ups ───────────────────────
    @action(detail=False, methods=["get"], url_path="today-followups")
    def today_followups(self, request):
        today = timezone.now().date()
        base_qs = self.get_queryset()
        leads = base_qs.filter(follow_up_date=today).exclude(status__in=["CONVERTED", "LOST"])
        return Response(LeadListSerializer(leads, many=True).data)


# ─────────────────────────────────────────────
# ACTIVITY
# ─────────────────────────────────────────────
class ActivityViewSet(AuditModelViewSet):
    queryset = Activity.objects.all().order_by("-activity_date")
    serializer_class = ActivitySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ["summary", "description"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        
        # ── Role-based scoping ────────────────────────────────────────────────
        if not is_admin_user(user):
            # Only see activities for leads assigned to this user 
            # (or fallback to their own customers, if customer logic is added later)
            qs = qs.filter(Q(lead__assigned_to=user) | Q(lead__isnull=True))

        lead_id      = self.request.query_params.get("lead")
        customer_id  = self.request.query_params.get("customer")
        activity_type = self.request.query_params.get("type")

        if lead_id:
            qs = qs.filter(lead_id=lead_id)
        if customer_id:
            qs = qs.filter(customer_id=customer_id)
        if activity_type:
            qs = qs.filter(activity_type=activity_type.upper())

        return qs


# ─────────────────────────────────────────────
# FOLLOW-UP
# ─────────────────────────────────────────────
class FollowUpViewSet(AuditModelViewSet):
    queryset = FollowUp.objects.all().order_by("scheduled_at")
    serializer_class = FollowUpSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        
        # ── Role-based scoping ────────────────────────────────────────────────
        if not is_admin_user(user):
            qs = qs.filter(Q(lead__assigned_to=user) | Q(lead__isnull=True))

        lead_id     = self.request.query_params.get("lead")
        customer_id = self.request.query_params.get("customer")
        fu_status   = self.request.query_params.get("status")
        upcoming    = self.request.query_params.get("upcoming")

        if lead_id:
            qs = qs.filter(lead_id=lead_id)
        if customer_id:
            qs = qs.filter(customer_id=customer_id)
        if fu_status:
            qs = qs.filter(status=fu_status.upper())
        if upcoming == "true":
            qs = qs.filter(scheduled_at__gte=timezone.now(), status="PENDING")

        return qs

    @action(detail=True, methods=["post"], url_path="mark-done")
    def mark_done(self, request, pk=None):
        follow_up = self.get_object()
        follow_up.status = "DONE"
        follow_up.remarks = request.data.get("remarks", follow_up.remarks)
        follow_up.save()
        return Response({"message": "Follow-up marked as done."})


# ─────────────────────────────────────────────
# CRM DASHBOARD
# ─────────────────────────────────────────────
class CRMDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        user = request.user
        admin = is_admin_user(user)

        # Base queryset scoped by role
        if admin:
            base_qs = Lead.objects.all()
        else:
            base_qs = Lead.objects.filter(assigned_to=user)

        total = base_qs.count()
        by_status = base_qs.values("status").annotate(count=Count("id"))
        today_followups = base_qs.filter(
            follow_up_date=today
        ).exclude(status__in=["CONVERTED", "LOST"]).count()

        my_leads = Lead.objects.filter(assigned_to=user).count()

        recent_leads = LeadListSerializer(
            base_qs.order_by("-created_at")[:5], many=True
        ).data

        today_followup_leads = LeadListSerializer(
            base_qs.filter(follow_up_date=today).exclude(
                status__in=["CONVERTED", "LOST"]
            ).order_by("follow_up_date")[:10],
            many=True,
        ).data

        status_map = {s["status"]: s["count"] for s in by_status}

        response_data = {
            "total_leads": total,
            "by_status": {
                "NEW":       status_map.get("NEW", 0),
                "CONTACTED": status_map.get("CONTACTED", 0),
                "QUALIFIED": status_map.get("QUALIFIED", 0),
                "CONVERTED": status_map.get("CONVERTED", 0),
                "LOST":      status_map.get("LOST", 0),
            },
            "today_followups": today_followups,
            "my_leads": my_leads,
            "is_admin": admin,
            "recent_leads": recent_leads,
            "today_followup_leads": today_followup_leads,
        }

        # Admin-only: per-user lead stats for team overview
        if admin:
            user_stats = (
                Lead.objects.values("assigned_to", "assigned_to__first_name", "assigned_to__last_name", "assigned_to__username")
                .annotate(total=Count("id"))
                .order_by("-total")
            )
            response_data["user_stats"] = [
                {
                    "user_id": u["assigned_to"],
                    "name": f"{u['assigned_to__first_name']} {u['assigned_to__last_name']}".strip() or u["assigned_to__username"] or "Unassigned",
                    "total": u["total"],
                }
                for u in user_stats
            ]
            response_data["unassigned_count"] = Lead.objects.filter(assigned_to__isnull=True).count()

        return Response(response_data)


# ─────────────────────────────────────────────
# USERS FOR ASSIGNMENT (dropdown)
# ─────────────────────────────────────────────
class UsersForAssignmentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return approved, active users for the lead assignment dropdown."""
        users = User.objects.filter(is_active=True).order_by("first_name", "username")
        data = [
            {
                "id": u.id,
                "username": u.username,
                "full_name": u.get_full_name() or u.username,
            }
            for u in users
        ]
        return Response(data)


# ─────────────────────────────────────────────
# CURRENT USER PROFILE (for role-based UI)
# ─────────────────────────────────────────────
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile_data = {
            "id": user.id,
            "username": user.username,
            "full_name": user.get_full_name() or user.username,
            "email": user.email,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
        }
        # Attach approval profile if exists
        try:
            profile = user.profile
            profile_data["role_title"] = profile.role_title
            profile_data["department"] = profile.department
            profile_data["approval_status"] = profile.approval_status
        except Exception:
            profile_data["role_title"] = "Admin" if user.is_superuser else "Staff"
            profile_data["department"] = ""
            profile_data["approval_status"] = "approved"

        return Response(profile_data)

# ─────────────────────────────────────────────
# ZOHO MODULES (Account, Contact, Deal, Quote)
# ─────────────────────────────────────────────
class AccountViewSet(AuditModelViewSet):
    queryset = Account.objects.all().order_by("-created_at")
    serializer_class = AccountSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "industry", "phone", "website"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not is_admin_user(user):
            qs = qs.filter(assigned_to=user)
        return qs

class ContactViewSet(AuditModelViewSet):
    queryset = Contact.objects.all().select_related("account").order_by("-created_at")
    serializer_class = ContactSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["first_name", "last_name", "email", "phone"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not is_admin_user(user):
            qs = qs.filter(assigned_to=user)
        
        account_id = self.request.query_params.get("account")
        if account_id:
            qs = qs.filter(account_id=account_id)
            
        return qs

class DealViewSet(AuditModelViewSet):
    queryset = Deal.objects.all().select_related("account", "contact").order_by("-created_at")
    serializer_class = DealSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not is_admin_user(user):
            qs = qs.filter(assigned_to=user)
            
        account_id = self.request.query_params.get("account")
        contact_id = self.request.query_params.get("contact")
        stage = self.request.query_params.get("stage")
        
        if account_id:
            qs = qs.filter(account_id=account_id)
        if contact_id:
            qs = qs.filter(contact_id=contact_id)
        if stage:
            qs = qs.filter(stage=stage.upper())
            
        return qs

class QuoteViewSet(AuditModelViewSet):
    queryset = Quote.objects.all().select_related("deal").prefetch_related("line_items").order_by("-created_at")
    serializer_class = QuoteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["quote_number", "deal__name"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not is_admin_user(user):
            qs = qs.filter(deal__assigned_to=user)
            
        deal_id = self.request.query_params.get("deal")
        if deal_id:
            qs = qs.filter(deal_id=deal_id)
            
        return qs