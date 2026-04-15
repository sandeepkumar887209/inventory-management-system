from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db import transaction

from .models import Rental, RentalItem
from .serializers import RentalSerializer, RentalItemSerializer
from apps.inventory.models import Laptop, StockMovement

from apps.audit.middleware import AuditModelMixin
from apps.audit.models import AuditLog


class RentalViewSet(AuditModelMixin, ModelViewSet):
    audit_module = AuditLog.MODULE_RENTALS
    queryset = (
        Rental.objects
        .select_related("customer", "parent_rental")
        .prefetch_related("items__laptop")
        .order_by("-created_at")
    )
    serializer_class = RentalSerializer

    # ── Filtering & search ─────────────────────────────────────────────
    filter_backends  = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["status", "customer"]
    search_fields    = ["customer__name", "items__snapshot_customer_name"]
    ordering_fields  = ["created_at", "rent_date", "total_amount"]


    # =========================================================
    # 🔥 RETURN LAPTOPS
    # =========================================================
    @action(detail=True, methods=["post"])
    @transaction.atomic
    def return_laptops(self, request, pk=None):

        original_rental = self.get_object()
        laptop_ids = request.data.get("laptops", [])

        if not laptop_ids:
            return Response(
                {"error": "No laptops selected"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 🔥 Create NEW rental entry (history)
        new_rental = Rental.objects.create(
            customer=original_rental.customer,
            parent_rental=original_rental,
            expected_return_date=original_rental.expected_return_date,
            actual_return_date=timezone.now().date(),
            status="RETURNED",
            subtotal=original_rental.subtotal,
            gst=original_rental.gst,
            total_amount=original_rental.total_amount,
        )

        returned = []

        for laptop_id in laptop_ids:
            try:
                laptop = Laptop.objects.get(
                    id=laptop_id,
                    customer=original_rental.customer,
                    status="RENTED"
                )
            except Laptop.DoesNotExist:
                continue

            # 🔥 Stock movement
            StockMovement.objects.create(
                laptop=laptop,
                movement_type="RETURN",
                quantity=1,
                remarks=f"Returned from Rental #{original_rental.id}"
            )

            # Update inventory
            laptop.status = "AVAILABLE"
            laptop.customer = None
            laptop.save()

            # 🔥 Store in RentalItem
            RentalItem.objects.create(
                rental=new_rental,
                laptop=laptop,
                rent_price=laptop.rent_per_month
            )

            returned.append(laptop.serial_number)

        if not returned:
            raise Exception("No valid laptops returned")

        return Response({
            "success": True,
            "new_rental_id": new_rental.id,
            "returned_laptops": returned
        })


    # =========================================================
    # 🔥 REPLACE LAPTOP
    # =========================================================
    @action(detail=True, methods=["post"])
    @transaction.atomic
    def replace_laptop(self, request, pk=None):

        original_rental = self.get_object()
        old_id = request.data.get("old_laptop")
        new_id = request.data.get("new_laptop")

        if not old_id or not new_id:
            return Response(
                {"error": "Old and New laptop required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            old_laptop = Laptop.objects.get(
                id=old_id,
                customer=original_rental.customer,
                status="RENTED"
            )
        except Laptop.DoesNotExist:
            return Response(
                {"error": "Old laptop invalid"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            new_laptop = Laptop.objects.get(
                id=new_id,
                status="AVAILABLE"
            )
        except Laptop.DoesNotExist:
            return Response(
                {"error": "New laptop not available"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 🔥 Create NEW rental entry
        new_rental = Rental.objects.create(
            customer=original_rental.customer,
            parent_rental=original_rental,
            expected_return_date=original_rental.expected_return_date,
            status="REPLACED",
            subtotal=original_rental.subtotal,
            gst=original_rental.gst,
            total_amount=original_rental.total_amount,
        )

        # -----------------------
        # OLD → RETURN
        # -----------------------
        StockMovement.objects.create(
            laptop=old_laptop,
            movement_type="RETURN",
            quantity=1,
            remarks=f"Replacement - Rental #{original_rental.id}"
        )

        old_laptop.status = "AVAILABLE"
        old_laptop.customer = None
        old_laptop.save()

        RentalItem.objects.create(
            rental=new_rental,
            laptop=old_laptop,
            rent_price=old_laptop.rent_per_month
        )

        # -----------------------
        # NEW → OUT
        # -----------------------
        StockMovement.objects.create(
            laptop=new_laptop,
            movement_type="OUT",
            quantity=1,
            remarks=f"Replacement - Rental #{original_rental.id}"
        )

        new_laptop.status = "RENTED"
        new_laptop.customer = original_rental.customer
        new_laptop.save()

        RentalItem.objects.create(
            rental=new_rental,
            laptop=new_laptop,
            rent_price=new_laptop.rent_per_month
        )

        return Response({
            "success": True,
            "new_rental_id": new_rental.id
        })


# =========================================================
# 📋 RENTAL ITEM — direct ledger endpoint
#    GET /rentals/rental-items/?customer=<id>
#    Returns every RentalItem for a given customer using the
#    denormalised snapshot_customer_name + rental__customer FK.
# =========================================================
class RentalItemViewSet(ReadOnlyModelViewSet):
    serializer_class = RentalItemSerializer

    filter_backends  = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields    = ["snapshot_customer_name", "snapshot_serial_number", "snapshot_brand", "snapshot_model"]
    ordering_fields  = ["id", "rental__rent_date", "rent_price"]
    ordering         = ["-id"]

    def get_queryset(self):
        qs = (
            RentalItem.objects
            .select_related("rental", "rental__customer", "laptop")
            .order_by("-rental__rent_date", "-id")
        )
        customer_id = self.request.query_params.get("customer")
        if customer_id:
            qs = qs.filter(rental__customer_id=customer_id)
        laptop_id = self.request.query_params.get("laptop")
        if laptop_id:
            qs = qs.filter(laptop_id=laptop_id)
        return qs