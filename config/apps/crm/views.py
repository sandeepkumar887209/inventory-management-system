from django.db import transaction
from django.utils import timezone
from rest_framework import filters, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.common.viewsets import AuditModelViewSet
from apps.common.permissions import IsStaffOrAdmin
from apps.customers.models import Customer

from .models import Lead, Activity, FollowUp, Tag, LeadTag, CustomerTag
from .serializers import (
    LeadSerializer,
    LeadListSerializer,
    ActivitySerializer,
    FollowUpSerializer,
    TagSerializer,
)


# ─────────────────────────────────────────────
# TAG
# ─────────────────────────────────────────────
class TagViewSet(AuditModelViewSet):
    queryset = Tag.objects.all().order_by("name")
    serializer_class = TagSerializer
    permission_classes = [IsStaffOrAdmin]


# ─────────────────────────────────────────────
# LEAD
# ─────────────────────────────────────────────
class LeadViewSet(AuditModelViewSet):
    queryset = Lead.objects.all().order_by("-created_at")
    serializer_class = LeadSerializer
    permission_classes = [IsStaffOrAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "phone", "email", "company"]

    def get_serializer_class(self):
        if self.action == "list":
            return LeadListSerializer
        return LeadSerializer

    def get_queryset(self):
        qs = super().get_queryset()

        status_param = self.request.query_params.get("status")
        source = self.request.query_params.get("source")
        intent = self.request.query_params.get("intent")
        follow_up_today = self.request.query_params.get("follow_up_today")

        if status_param:
            qs = qs.filter(status=status_param.upper())
        if source:
            qs = qs.filter(source=source.upper())
        if intent:
            qs = qs.filter(intent=intent.upper())
        if follow_up_today == "true":
            qs = qs.filter(follow_up_date=timezone.now().date())

        return qs

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

        if lead.converted_customer:
            return Response(
                {"error": "Lead already has a linked customer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        customer = Customer.objects.create(
            name=lead.name,
            phone=lead.phone,
            email=lead.email,
            address=lead.address,
            customer_type="company" if lead.company else "individual",
            created_by=request.user,
        )

        lead.converted_customer = customer
        lead.status = "CONVERTED"
        lead.save()

        return Response(
            {
                "message": "Lead converted to customer successfully.",
                "customer_id": customer.id,
            },
            status=status.HTTP_200_OK,
        )

    # ── Add tag to lead ──────────────────────────
    @action(detail=True, methods=["post"], url_path="add-tag")
    def add_tag(self, request, pk=None):
        lead = self.get_object()
        tag_id = request.data.get("tag_id")
        try:
            tag = Tag.objects.get(id=tag_id)
        except Tag.DoesNotExist:
            return Response({"error": "Tag not found."}, status=status.HTTP_404_NOT_FOUND)

        LeadTag.objects.get_or_create(lead=lead, tag=tag)
        return Response({"message": f"Tag '{tag.name}' added to lead."})

    # ── Remove tag from lead ─────────────────────
    @action(detail=True, methods=["post"], url_path="remove-tag")
    def remove_tag(self, request, pk=None):
        lead = self.get_object()
        tag_id = request.data.get("tag_id")
        LeadTag.objects.filter(lead=lead, tag_id=tag_id).delete()
        return Response({"message": "Tag removed."})

    # ── Lead pipeline summary ────────────────────
    @action(detail=False, methods=["get"], url_path="pipeline")
    def pipeline(self, request):
        stages = ["NEW", "CONTACTED", "NEGOTIATION", "CONVERTED", "LOST"]
        data = {}
        for stage in stages:
            qs = Lead.objects.filter(status=stage)
            data[stage] = {
                "count": qs.count(),
                "leads": LeadListSerializer(qs[:5], many=True).data,
            }
        return Response(data)

    # ── Today's follow-ups ───────────────────────
    @action(detail=False, methods=["get"], url_path="today-followups")
    def today_followups(self, request):
        today = timezone.now().date()
        leads = Lead.objects.filter(follow_up_date=today).exclude(status__in=["CONVERTED", "LOST"])
        return Response(LeadListSerializer(leads, many=True).data)


# ─────────────────────────────────────────────
# ACTIVITY
# ─────────────────────────────────────────────
class ActivityViewSet(AuditModelViewSet):
    queryset = Activity.objects.all().order_by("-activity_date")
    serializer_class = ActivitySerializer
    permission_classes = [IsStaffOrAdmin]
    filter_backends = [filters.SearchFilter]
    search_fields = ["summary", "description"]

    def get_queryset(self):
        qs = super().get_queryset()
        lead_id = self.request.query_params.get("lead")
        customer_id = self.request.query_params.get("customer")
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
    permission_classes = [IsStaffOrAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        lead_id = self.request.query_params.get("lead")
        customer_id = self.request.query_params.get("customer")
        fu_status = self.request.query_params.get("status")
        upcoming = self.request.query_params.get("upcoming")

        if lead_id:
            qs = qs.filter(lead_id=lead_id)
        if customer_id:
            qs = qs.filter(customer_id=customer_id)
        if fu_status:
            qs = qs.filter(status=fu_status.upper())
        if upcoming == "true":
            qs = qs.filter(
                scheduled_at__gte=timezone.now(),
                status="PENDING"
            )

        return qs

    # ── Mark follow-up as done ───────────────────
    @action(detail=True, methods=["post"], url_path="mark-done")
    def mark_done(self, request, pk=None):
        follow_up = self.get_object()
        follow_up.status = "DONE"
        follow_up.remarks = request.data.get("remarks", follow_up.remarks)
        follow_up.save()
        return Response({"message": "Follow-up marked as done."})