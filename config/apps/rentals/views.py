from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone

from .models import Rental, RentalItem
from .serializers import RentalSerializer
from apps.inventory.models import Laptop, StockMovement


class RentalViewSet(ModelViewSet):
    queryset = Rental.objects.all().order_by("-created_at")
    serializer_class = RentalSerializer

    # 🔥 RETURN → CREATE NEW RENTAL ENTRY
    @action(detail=True, methods=["post"])
    def return_laptops(self, request, pk=None):
        original_rental = self.get_object()
        laptop_ids = request.data.get("laptops", [])

        if not laptop_ids:
            return Response({"error": "No laptops selected"},
                            status=status.HTTP_400_BAD_REQUEST)

        # Create NEW rental entry
        new_rental = Rental.objects.create(
            customer=original_rental.customer,
            parent_rental=original_rental,
            expected_return_date=original_rental.expected_return_date,
            actual_return_date=timezone.now().date(),
            status="RETURNED",
            gst=original_rental.gst
        )

        returned = []

        for lid in laptop_ids:
            try:
                old_item = RentalItem.objects.get(
                    rental=original_rental,
                    laptop_id=lid
                )
            except RentalItem.DoesNotExist:
                continue

            laptop = old_item.laptop

            if laptop.status != "RENTED":
                continue

            # Make laptop available
            laptop.status = "AVAILABLE"
            laptop.save()

            StockMovement.objects.create(
                laptop=laptop,
                movement_type="RETURN",
                quantity=1,
                remarks=f"Return Rental #{original_rental.id}"
            )

            RentalItem.objects.create(
                rental=new_rental,
                laptop=laptop,
                rent_price=old_item.rent_price
            )

            returned.append(laptop.serial_number)

        return Response({
            "success": True,
            "new_rental_id": new_rental.id,
            "returned_laptops": returned
        })

    # 🔥 REPLACEMENT → CREATE NEW RENTAL ENTRY
    @action(detail=True, methods=["post"])
    def replace_laptop(self, request, pk=None):
        original_rental = self.get_object()
        old_id = request.data.get("old_laptop")
        new_id = request.data.get("new_laptop")

        try:
            old_item = RentalItem.objects.get(
                rental=original_rental,
                laptop_id=old_id
            )
        except RentalItem.DoesNotExist:
            return Response({"error": "Old laptop invalid"},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            new_laptop = Laptop.objects.get(id=new_id, status="AVAILABLE")
        except Laptop.DoesNotExist:
            return Response({"error": "New laptop not available"},
                            status=status.HTTP_400_BAD_REQUEST)

        # Create NEW rental entry
        new_rental = Rental.objects.create(
            customer=original_rental.customer,
            parent_rental=original_rental,
            expected_return_date=original_rental.expected_return_date,
            status="REPLACED",
            gst=original_rental.gst
        )

        old_laptop = old_item.laptop

        # Old laptop → available
        old_laptop.status = "AVAILABLE"
        old_laptop.save()

        StockMovement.objects.create(
            laptop=old_laptop,
            movement_type="RETURN",
            quantity=1,
            remarks=f"Replacement Rental #{original_rental.id}"
        )

        # New laptop → rented
        new_laptop.status = "RENTED"
        new_laptop.save()

        StockMovement.objects.create(
            laptop=new_laptop,
            movement_type="OUT",
            quantity=1,
            remarks=f"Replacement Rental #{original_rental.id}"
        )

        RentalItem.objects.create(
            rental=new_rental,
            laptop=old_laptop,
            rent_price=old_item.rent_price
        )

        RentalItem.objects.create(
            rental=new_rental,
            laptop=new_laptop,
            rent_price=old_item.rent_price
        )

        return Response({
            "success": True,
            "new_rental_id": new_rental.id
        })