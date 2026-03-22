from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction

from .models import Sale, SaleItem
from .serializers import SaleSerializer
from apps.inventory.models import Laptop, StockMovement


class SaleViewSet(ModelViewSet):
    queryset = Sale.objects.all().order_by("-created_at")
    serializer_class = SaleSerializer

    # =========================================================
    # 🔄 RETURN LAPTOPS
    # =========================================================
    @action(detail=True, methods=["post"])
    @transaction.atomic
    def return_laptops(self, request, pk=None):
        """
        Mark specific laptops in a sale as returned.
        Returns them to AVAILABLE inventory.

        POST /sales/sale/{id}/return_laptops/
        Body: { "laptops": [laptop_id, ...] }
        """
        sale = self.get_object()
        laptop_ids = request.data.get("laptops", [])

        if not laptop_ids:
            return Response(
                {"error": "No laptops selected"},
                status=status.HTTP_400_BAD_REQUEST
            )

        returned = []
        not_found = []

        for laptop_id in laptop_ids:
            try:
                laptop = Laptop.objects.get(
                    id=laptop_id,
                    status="SOLD"
                )
            except Laptop.DoesNotExist:
                not_found.append(laptop_id)
                continue

            # Create stock movement (RETURN)
            StockMovement.objects.create(
                laptop=laptop,
                movement_type="RETURN",
                quantity=1,
                remarks=f"Returned from Sale #{sale.id}",
                created_by=request.user if request.user.is_authenticated else None,
            )

            # Restore laptop to available
            laptop.status = "AVAILABLE"
            laptop.customer = None
            laptop.save()

            returned.append(laptop.serial_number)

        if not returned:
            return Response(
                {"error": "No valid laptops could be returned. They may already be available or not found."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Mark sale as RETURNED if all items are returned
        all_laptops = [item.laptop for item in sale.items.select_related("laptop").all()]
        if all(l.status == "AVAILABLE" for l in all_laptops):
            sale.status = "RETURNED"
            sale.save(update_fields=["status"])

        return Response({
            "success": True,
            "returned_laptops": returned,
            "not_found": not_found,
            "sale_status": sale.status,
        })

    # =========================================================
    # 🔁 REPLACE LAPTOP
    # =========================================================
    @action(detail=True, methods=["post"])
    @transaction.atomic
    def replace_laptop(self, request, pk=None):
        """
        Swap a laptop in a sale with another available unit.

        POST /sales/sale/{id}/replace_laptop/
        Body: { "old_laptop": id, "new_laptop": id }
        """
        sale = self.get_object()
        old_id = request.data.get("old_laptop")
        new_id = request.data.get("new_laptop")

        if not old_id or not new_id:
            return Response(
                {"error": "Both old_laptop and new_laptop are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate old laptop is part of this sale
        try:
            sale_item = SaleItem.objects.select_related("laptop").get(
                sale=sale,
                laptop_id=old_id,
            )
            old_laptop = sale_item.laptop
        except SaleItem.DoesNotExist:
            return Response(
                {"error": "The specified laptop is not part of this sale"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate new laptop is available
        try:
            new_laptop = Laptop.objects.get(id=new_id, status="AVAILABLE")
        except Laptop.DoesNotExist:
            return Response(
                {"error": "Replacement laptop is not available"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── Return old laptop ─────────────────────────────────
        StockMovement.objects.create(
            laptop=old_laptop,
            movement_type="RETURN",
            quantity=1,
            remarks=f"Replaced in Sale #{sale.id}",
            created_by=request.user if request.user.is_authenticated else None,
        )
        old_laptop.status = "AVAILABLE"
        old_laptop.customer = None
        old_laptop.save()

        # ── Mark new laptop as sold ───────────────────────────
        StockMovement.objects.create(
            laptop=new_laptop,
            movement_type="SOLD",
            quantity=1,
            remarks=f"Replacement in Sale #{sale.id}",
            created_by=request.user if request.user.is_authenticated else None,
        )
        new_laptop.status = "SOLD"
        new_laptop.customer = sale.customer
        new_laptop.save()

        # ── Update the SaleItem ───────────────────────────────
        old_price = sale_item.sale_price
        sale_item.laptop = new_laptop
        # Keep the same sale price unless caller overrides
        new_price = request.data.get("new_price")
        if new_price is not None:
            sale_item.sale_price = new_price
        sale_item.save()

        return Response({
            "success": True,
            "old_laptop": {
                "id": old_laptop.id,
                "serial": old_laptop.serial_number,
                "model": f"{old_laptop.brand} {old_laptop.model}",
            },
            "new_laptop": {
                "id": new_laptop.id,
                "serial": new_laptop.serial_number,
                "model": f"{new_laptop.brand} {new_laptop.model}",
            },
            "sale_id": sale.id,
        })