from django.db import transaction
from rest_framework import filters, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.common.viewsets import AuditModelViewSet
from apps.common.permissions import IsStaffOrAdmin

from .models import Laptop, LaptopHistory, StockMovement, Supplier
from .serializers import (
    LaptopSerializer,
    LaptopListSerializer,
    LaptopHistorySerializer,
    StockMovementSerializer,
    SupplierSerializer,
)


class SupplierViewSet(AuditModelViewSet):
    queryset           = Supplier.objects.all().order_by("name")
    serializer_class   = SupplierSerializer
    permission_classes = [IsStaffOrAdmin]
    filter_backends    = [filters.SearchFilter]
    search_fields      = ["name", "phone", "email"]


class LaptopViewSet(AuditModelViewSet):
    queryset           = Laptop.objects.all().order_by("-created_at")
    serializer_class   = LaptopSerializer
    permission_classes = [IsStaffOrAdmin]
    filter_backends    = [filters.OrderingFilter, filters.SearchFilter]
    search_fields      = ["brand", "model", "serial_number", "asset_tag", "customer__name"]

    def get_serializer_class(self):
        if self.action == "list":
            return LaptopListSerializer
        return LaptopSerializer

    def get_queryset(self):
        qs          = super().get_queryset()
        status_p    = self.request.query_params.get("status")
        brand       = self.request.query_params.get("brand")
        customer_id = self.request.query_params.get("customer")
        condition   = self.request.query_params.get("condition")

        if status_p:
            qs = qs.filter(status=status_p.upper())
        if brand:
            qs = qs.filter(brand__iexact=brand)
        if customer_id:
            qs = qs.filter(customer_id=customer_id)
        if condition:
            qs = qs.filter(condition=condition.upper())
        return qs

    # ── Laptops are never deleted ─────────────────────────────────────────────
    def destroy(self, request, *args, **kwargs):
        return Response(
            {"error": "Laptops cannot be deleted. Use 'Return to Supplier' or 'Write Off' instead."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    # ── Return to supplier ────────────────────────────────────────────────────
    @action(detail=True, methods=["post"], url_path="return-to-supplier")
    @transaction.atomic
    def return_to_supplier(self, request, pk=None):
        laptop  = self.get_object()
        remarks = request.data.get("remarks", "")

        if laptop.status == "RETURNED_TO_SUPPLIER":
            return Response({"error": "Already returned to supplier."}, status=400)

        old_status = laptop.status

        # Create stock movement first — signal will update laptop.status
        StockMovement.objects.create(
            laptop=laptop,
            movement_type="SUPPLIER_RETURN",
            quantity=1,
            remarks=remarks,
            created_by=request.user,
        )

        # Reload and also write an explicit history entry with the user attached
        laptop.refresh_from_db()
        LaptopHistory.objects.get_or_create(
            laptop=laptop,
            action="RETURNED_TO_SUPPLIER",
            from_status=old_status,
            to_status="RETURNED_TO_SUPPLIER",
            defaults={"remarks": remarks, "created_by": request.user},
        )

        return Response({"message": "Laptop returned to supplier."})

    # ── Send for maintenance ──────────────────────────────────────────────────
    @action(detail=True, methods=["post"], url_path="send-maintenance")
    @transaction.atomic
    def send_maintenance(self, request, pk=None):
        laptop  = self.get_object()
        remarks = request.data.get("remarks", "")
        old_status = laptop.status

        StockMovement.objects.create(
            laptop=laptop,
            movement_type="MAINTENANCE_OUT",
            quantity=1,
            remarks=remarks,
            created_by=request.user,
        )

        laptop.refresh_from_db()
        LaptopHistory.objects.get_or_create(
            laptop=laptop,
            action="SENT_FOR_MAINTENANCE",
            from_status=old_status,
            to_status="UNDER_MAINTENANCE",
            defaults={"remarks": remarks, "created_by": request.user},
        )

        return Response({"message": "Laptop sent for maintenance."})

    # ── Return from maintenance ───────────────────────────────────────────────
    @action(detail=True, methods=["post"], url_path="return-from-maintenance")
    @transaction.atomic
    def return_from_maintenance(self, request, pk=None):
        laptop  = self.get_object()
        remarks = request.data.get("remarks", "")
        old_status = laptop.status

        StockMovement.objects.create(
            laptop=laptop,
            movement_type="MAINTENANCE_IN",
            quantity=1,
            remarks=remarks,
            created_by=request.user,
        )

        laptop.refresh_from_db()
        LaptopHistory.objects.get_or_create(
            laptop=laptop,
            action="MAINTENANCE_DONE",
            from_status=old_status,
            to_status="AVAILABLE",
            defaults={"remarks": remarks, "created_by": request.user},
        )

        return Response({"message": "Laptop returned from maintenance."})

    # ── Write off ─────────────────────────────────────────────────────────────
    @action(detail=True, methods=["post"], url_path="write-off")
    @transaction.atomic
    def write_off(self, request, pk=None):
        laptop  = self.get_object()
        remarks = request.data.get("remarks", "")

        if laptop.status == "WRITTEN_OFF":
            return Response({"error": "Already written off."}, status=400)

        old_status = laptop.status

        StockMovement.objects.create(
            laptop=laptop,
            movement_type="WRITTEN_OFF",
            quantity=1,
            remarks=remarks,
            created_by=request.user,
        )

        laptop.refresh_from_db()
        LaptopHistory.objects.get_or_create(
            laptop=laptop,
            action="WRITTEN_OFF",
            from_status=old_status,
            to_status="WRITTEN_OFF",
            defaults={"remarks": remarks, "created_by": request.user},
        )

        return Response({"message": "Laptop written off."})

    # ── History endpoint ──────────────────────────────────────────────────────
    @action(detail=True, methods=["get"], url_path="history")
    def history(self, request, pk=None):
        laptop  = self.get_object()
        history = LaptopHistory.objects.filter(laptop=laptop).order_by("-created_at")
        return Response(LaptopHistorySerializer(history, many=True).data)

    # ── Stock movements endpoint ──────────────────────────────────────────────
    @action(detail=True, methods=["get"], url_path="movements")
    def movements(self, request, pk=None):
        laptop    = self.get_object()
        movements = StockMovement.objects.filter(laptop=laptop).order_by("-created_at")
        return Response(StockMovementSerializer(movements, many=True).data)

    # ── Stats endpoint ────────────────────────────────────────────────────────
    @action(detail=False, methods=["get"], url_path="stats")
    def stats(self, request):
        qs = Laptop.objects.all()
        return Response({
            "total":                  qs.count(),
            "available":              qs.filter(status="AVAILABLE").count(),
            "rented":                 qs.filter(status="RENTED").count(),
            "sold":                   qs.filter(status="SOLD").count(),
            "under_maintenance":      qs.filter(status="UNDER_MAINTENANCE").count(),
            "returned_to_supplier":   qs.filter(status="RETURNED_TO_SUPPLIER").count(),
            "written_off":            qs.filter(status="WRITTEN_OFF").count(),
            "demo":                   qs.filter(status="DEMO").count(),
        })


class StockMovementViewSet(AuditModelViewSet):
    queryset           = StockMovement.objects.all().select_related("laptop")
    serializer_class   = StockMovementSerializer
    permission_classes = [IsStaffOrAdmin]

    def get_queryset(self):
        qs        = super().get_queryset()
        laptop_id = self.request.query_params.get("laptop")
        if laptop_id:
            qs = qs.filter(laptop_id=laptop_id)
        return qs
