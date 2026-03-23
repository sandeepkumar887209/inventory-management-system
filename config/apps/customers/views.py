from django.db.models import Sum, Count, Q
from django.utils import timezone

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.exceptions import ValidationError

from django_filters.rest_framework import DjangoFilterBackend

from apps.common.viewsets import AuditModelViewSet
from apps.common.permissions import IsStaffOrAdmin

from .models import Customer
from .serializers import (
    CustomerListSerializer,
    CustomerDetailSerializer,
    CustomerWriteSerializer,
    CustomerMinimalSerializer,
)


class CustomerViewSet(AuditModelViewSet):

    queryset = Customer.objects.all().order_by("-created_at")
    permission_classes = [IsStaffOrAdmin]

    # ── Filtering / search / ordering ──────────────────────────────────────

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["customer_type", "is_active", "city", "state"]
    search_fields   = ["name", "phone", "email", "company_name",
                       "gst_number", "pan_number", "cin_number"]
    ordering_fields = ["name", "created_at", "city"]
    ordering        = ["-created_at"]

    # ── Serializer routing ─────────────────────────────────────────────────

    def get_serializer_class(self):
        if self.action == "list":
            return CustomerListSerializer
        if self.action in ("create", "update", "partial_update"):
            return CustomerWriteSerializer
        if self.action == "minimal":
            return CustomerMinimalSerializer
        return CustomerDetailSerializer

    # ── Soft-delete override ───────────────────────────────────────────────

    def destroy(self, request, *args, **kwargs):
        customer = self.get_object()
        # Block deletion if customer has active rentals
        active_rentals = customer.rental_set.filter(status="ONGOING").count()
        if active_rentals:
            raise ValidationError(
                f"Cannot delete customer with {active_rentals} active rental(s). "
                "Close all rentals first."
            )
        customer.is_active = False
        customer.save(update_fields=["is_active", "updated_at"])
        return Response({"detail": "Customer deactivated successfully."}, status=200)

    # ══ Custom actions ══════════════════════════════════════════════════════

    @action(detail=False, methods=["get"], url_path="minimal")
    def minimal(self, request):
        """Lightweight list for dropdowns / select inputs."""
        qs = Customer.objects.filter(is_active=True).order_by("name")
        # Optional search param: /customers/minimal/?q=rahul
        q = request.query_params.get("q", "").strip()
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(phone__icontains=q))
        serializer = CustomerMinimalSerializer(qs, many=True)
        return Response(serializer.data)

    # ──────────────────────────────────────────────────────────────────────
    #  /customers/{id}/rentals/
    # ──────────────────────────────────────────────────────────────────────

    @action(detail=True, methods=["get"])
    def rentals(self, request, pk=None):
        from apps.rentals.models import Rental
        from apps.rentals.serializers import RentalSerializer

        customer = self.get_object()
        rentals  = (
            Rental.objects
            .filter(customer=customer)
            .select_related("customer")
            .prefetch_related("items_detail")
            .order_by("-created_at")
        )

        agg = rentals.aggregate(
            total_revenue=Sum("total_amount"),
            active_count=Count("id", filter=Q(status="ONGOING")),
            returned_count=Count("id", filter=Q(status="RETURNED")),
        )

        return Response({
            "total_rentals":    rentals.count(),
            "active_rentals":   agg["active_count"]   or 0,
            "returned_rentals": agg["returned_count"]  or 0,
            "total_revenue":    agg["total_revenue"]   or 0,
            "rentals":          RentalSerializer(rentals, many=True).data,
        })

    # ──────────────────────────────────────────────────────────────────────
    #  /customers/{id}/sales/
    # ──────────────────────────────────────────────────────────────────────

    @action(detail=True, methods=["get"])
    def sales(self, request, pk=None):
        from apps.sales.models import Sale
        from apps.sales.serializers import SaleSerializer

        customer = self.get_object()
        sales    = (
            Sale.objects
            .filter(customer=customer)
            .order_by("-created_at")
        )

        agg = sales.aggregate(total_revenue=Sum("total_amount"))

        return Response({
            "total_sales":   sales.count(),
            "total_revenue": agg["total_revenue"] or 0,
            "sales":         SaleSerializer(sales, many=True).data,
        })

    # ──────────────────────────────────────────────────────────────────────
    #  /customers/{id}/invoices/
    # ──────────────────────────────────────────────────────────────────────

    @action(detail=True, methods=["get"])
    def invoices(self, request, pk=None):
        from apps.invoices.models import Invoice
        from apps.invoices.serializers import InvoiceSerializer

        customer = self.get_object()
        invoices = (
            Invoice.objects
            .filter(customer=customer)
            .order_by("-created_at")
        )

        agg = invoices.aggregate(
            total_amount=Sum("total_amount"),
            paid_amount=Sum("total_amount", filter=Q(status="PAID")),
            pending_amount=Sum("total_amount", filter=Q(status__in=["UNPAID", "PARTIAL"])),
        )

        return Response({
            "total_invoices":   invoices.count(),
            "total_amount":     agg["total_amount"]   or 0,
            "paid_amount":      agg["paid_amount"]    or 0,
            "pending_amount":   agg["pending_amount"] or 0,
            "invoices":         InvoiceSerializer(invoices, many=True).data,
        })

    # ──────────────────────────────────────────────────────────────────────
    #  /customers/{id}/summary/
    #  Full financial overview in one call (used by customer detail page)
    # ──────────────────────────────────────────────────────────────────────

    @action(detail=True, methods=["get"])
    def summary(self, request, pk=None):
        from apps.rentals.models import Rental

        customer = self.get_object()

        # Rentals
        rentals = Rental.objects.filter(customer=customer)
        rental_agg = rentals.aggregate(
            total_revenue=Sum("total_amount"),
            active=Count("id", filter=Q(status="ONGOING")),
            returned=Count("id", filter=Q(status="RETURNED")),
        )

        # Sales (guard if app not installed)
        sales_count   = 0
        sales_revenue = 0
        try:
            from apps.sales.models import Sale
            sales_qs      = Sale.objects.filter(customer=customer)
            sales_agg     = sales_qs.aggregate(total=Sum("total_amount"))
            sales_count   = sales_qs.count()
            sales_revenue = sales_agg["total"] or 0
        except Exception:
            pass

        total_revenue = (rental_agg["total_revenue"] or 0) + sales_revenue

        return Response({
            "customer":         CustomerDetailSerializer(customer).data,
            "rentals": {
                "total":    rentals.count(),
                "active":   rental_agg["active"]   or 0,
                "returned": rental_agg["returned"] or 0,
                "revenue":  rental_agg["total_revenue"] or 0,
            },
            "sales": {
                "total":   sales_count,
                "revenue": sales_revenue,
            },
            "total_revenue": total_revenue,
        })

    # ──────────────────────────────────────────────────────────────────────
    #  /customers/{id}/activate/   (re-activate soft-deleted customer)
    # ──────────────────────────────────────────────────────────────────────

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        customer = self.get_object()
        if customer.is_active:
            return Response({"detail": "Customer is already active."}, status=400)
        customer.is_active = True
        customer.save(update_fields=["is_active", "updated_at"])
        return Response({"detail": "Customer reactivated successfully."})