"""
apps/rentals/serializers.py — with laptop + customer snapshot support
"""

from rest_framework import serializers
from .models import Rental, RentalItem
from apps.inventory.models import Laptop, StockMovement
from apps.customers.models import Customer


class CustomerNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = "__all__"


class InventoryNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Laptop
        fields = "__all__"


class RentalItemSerializer(serializers.ModelSerializer):
    # Live FK data (read-only, may be null if laptop deleted)
    laptop = InventoryNestedSerializer(read_only=True)
    laptop_id = serializers.PrimaryKeyRelatedField(
        queryset=Laptop.objects.all(),
        source="laptop",
        write_only=True
    )

    # Parent rental context — needed by the ledger
    rental_id     = serializers.IntegerField(source="rental.id",          read_only=True)
    rental_status = serializers.CharField(source="rental.status",         read_only=True)
    rental_date   = serializers.DateField(source="rental.rent_date",      read_only=True)
    expected_return_date = serializers.DateField(
        source="rental.expected_return_date", read_only=True
    )
    actual_return_date = serializers.DateField(
        source="rental.actual_return_date",   read_only=True
    )

    # Convenience read-only fields built from the snapshot
    display_name = serializers.ReadOnlyField()
    serial       = serializers.ReadOnlyField()

    class Meta:
        model = RentalItem
        fields = [
            "id",
            # FK / live
            "laptop", "laptop_id",
            # parent rental context
            "rental_id", "rental_status", "rental_date",
            "expected_return_date", "actual_return_date",
            # price
            "rent_price",
            # snapshot — identity
            "snapshot_brand",
            "snapshot_model",
            "snapshot_serial_number",
            "snapshot_asset_tag",
            # snapshot — specs
            "snapshot_processor",
            "snapshot_generation",
            "snapshot_ram",
            "snapshot_storage",
            "snapshot_gpu",
            "snapshot_display",
            "snapshot_os",
            "snapshot_color",
            "snapshot_condition",
            # snapshot — pricing
            "snapshot_list_price",
            "snapshot_rent_per_month",
            # snapshot — source
            "snapshot_purchased_from",
            # snapshot — customer
            "snapshot_customer_name",
            # computed helpers
            "display_name",
            "serial",
        ]
        read_only_fields = [
            "rental_id", "rental_status", "rental_date",
            "expected_return_date", "actual_return_date",
            "snapshot_brand", "snapshot_model", "snapshot_serial_number",
            "snapshot_asset_tag", "snapshot_processor", "snapshot_generation",
            "snapshot_ram", "snapshot_storage", "snapshot_gpu", "snapshot_display",
            "snapshot_os", "snapshot_color", "snapshot_condition",
            "snapshot_list_price", "snapshot_rent_per_month", "snapshot_purchased_from",
            "snapshot_customer_name",
            "display_name", "serial",
        ]


class RentalSerializer(serializers.ModelSerializer):
    customer_detail = CustomerNestedSerializer(source="customer", read_only=True)

    items = RentalItemSerializer(
        many=True,
        write_only=True,
        required=False
    )

    items_detail = RentalItemSerializer(
        source="items",
        many=True,
        read_only=True
    )

    total_items = serializers.SerializerMethodField()

    class Meta:
        model = Rental
        fields = "__all__"

    def get_total_items(self, obj):
        return obj.items.count()

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        rental = Rental.objects.create(**validated_data)

        subtotal = 0

        for item in items_data:
            laptop     = item["laptop"]
            rent_price = item["rent_price"]

            if laptop.status != "AVAILABLE":
                raise serializers.ValidationError(
                    f"Laptop {laptop.serial_number} is not available."
                )

            laptop.status   = "RENTED"
            laptop.customer = rental.customer
            laptop.save()

            StockMovement.objects.create(
                laptop=laptop,
                movement_type="OUT",
                quantity=1,
                remarks=f"Rental #{rental.id}"
            )

            # RentalItem.save() will auto-populate the snapshot fields
            RentalItem.objects.create(
                rental=rental,
                laptop=laptop,
                rent_price=rent_price
            )

            subtotal += rent_price

        gst_amount   = (subtotal * rental.gst) / 100
        rental.subtotal      = subtotal
        rental.total_amount  = subtotal + gst_amount
        rental.save()

        return rental