from django.db.models import Sum
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.common.viewsets import AuditModelViewSet
from .models import Customer
from .serializers import CustomerSerializer
from apps.common.permissions import IsStaffOrAdmin
from apps.rentals.models import Rental


class CustomerViewSet(AuditModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsStaffOrAdmin]

    @action(detail=True, methods=["get"])
    def rentals(self, request, pk=None):
        customer = self.get_object()
        rentals = Rental.objects.filter(customer=customer)

        total_amount = rentals.aggregate(
            total=Sum("total_amount")
        )["total"] or 0

        active_count = rentals.filter(status="ONGOING").count()
        returned_count = rentals.filter(status="RETURNED").count()

        return Response({
            "total_rentals": rentals.count(),
            "active_rentals": active_count,
            "returned_rentals": returned_count,
            "total_revenue": total_amount,
            "rentals": [
                {
                    "id": r.id,
                    "status": r.status,
                    "subtotal": r.subtotal,
                    "total_amount": r.total_amount,
                    "created_at": r.created_at,
                }
                for r in rentals
            ]
        })