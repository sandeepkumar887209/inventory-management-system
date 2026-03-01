from apps.common.viewsets import AuditModelViewSet
from .models import Laptop, StockMovement
from .serializers import LaptopSerializer, StockMovementSerializer
from apps.common.permissions import IsStaffOrAdmin
from rest_framework import filters


class LaptopViewSet(AuditModelViewSet):
    queryset = Laptop.objects.all().order_by("-id")
    serializer_class = LaptopSerializer
    permission_classes = [IsStaffOrAdmin]
    filterset_fields = ["status", "brand", "model", "customer"]  # <-- add customer here
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    search_fields = ["brand", "model", "serial_number", "customer__name"]  # optional search by customer name

    def get_queryset(self):
        qs = super().get_queryset()
        status = self.request.query_params.get("status")
        customer_id = self.request.query_params.get("customer")

        if status:
            qs = qs.filter(status=status.upper())
        if customer_id:
            qs = qs.filter(customer_id=customer_id)

        return qs


class StockMovementViewSet(AuditModelViewSet):
    queryset = StockMovement.objects.all().select_related("laptop")
    serializer_class = StockMovementSerializer
    permission_classes = [IsStaffOrAdmin]