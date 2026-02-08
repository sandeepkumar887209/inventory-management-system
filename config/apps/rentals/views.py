from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.utils.timezone import now

from apps.common.viewsets import AuditModelViewSet
from apps.rentals.models import Rental
from apps.rentals.serializers import RentalSerializer
from apps.inventory.models import StockMovement


class RentalViewSet(AuditModelViewSet):
    # queryset = Rental.objects.all()
    queryset = Rental.objects.select_related("customer", "laptop")
    serializer_class = RentalSerializer

    @action(detail=True, methods=["post"])
    def return_laptop(self, request, pk=None):
        rental = self.get_object()

        if rental.status == "RETURNED":
            return Response(
                {"detail": "Laptop already returned"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update rental
        rental.status = "RETURNED"
        rental.actual_return_date = now().date()
        rental.save()

        # Update laptop
        laptop = rental.laptop
        laptop.status = "AVAILABLE"
        laptop.save()

        # Stock movement log
        StockMovement.objects.create(
            laptop=laptop,
            movement_type="RETURN",
            remarks="Laptop returned",
            created_by=request.user
        )

        return Response(
            {"detail": "Laptop returned successfully"},
            status=status.HTTP_200_OK
        )
