"""
apps/sales/serializers.py — with laptop + customer snapshot support
"""

from rest_framework import serializers
from .models import Sale, SaleItem
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


class SaleItemSerializer(serializers.ModelSerializer):

    laptop = InventoryNestedSerializer(read_only=True)
    laptop_id = serializers.PrimaryKeyRelatedField(
        queryset=Laptop.objects.filter(status="AVAILABLE"),
        source="laptop",
        write_only=True
    )

    # Allow overriding price (discount price)
    sale_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False
    )

    # Parent sale context — needed by the ledger
    sale_id     = serializers.IntegerField(source="sale.id",        read_only=True)
    sale_status = serializers.CharField(source="sale.status",       read_only=True)
    sale_date   = serializers.DateField(source="sale.sale_date",    read_only=True)

    # Convenience read-only helpers built from the snapshot
    display_name = serializers.ReadOnlyField()
    serial       = serializers.ReadOnlyField()

    class Meta:
        model = SaleItem
        fields = [
            "id",
            # FK / live
            "laptop", "laptop_id",
            # parent sale context
            "sale_id", "sale_status", "sale_date",
            # price
            "sale_price",
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
            # snapshot — source
            "snapshot_purchased_from",
            # snapshot — customer
            "snapshot_customer_name",
            # computed helpers
            "display_name",
            "serial",
        ]
        read_only_fields = [
            "sale_id", "sale_status", "sale_date",
            "snapshot_brand", "snapshot_model", "snapshot_serial_number",
            "snapshot_asset_tag", "snapshot_processor", "snapshot_generation",
            "snapshot_ram", "snapshot_storage", "snapshot_gpu", "snapshot_display",
            "snapshot_os", "snapshot_color", "snapshot_condition",
            "snapshot_list_price", "snapshot_purchased_from",
            "snapshot_customer_name",
            "display_name", "serial",
        ]


class SaleSerializer(serializers.ModelSerializer):

    customer_detail = CustomerNestedSerializer(source="customer", read_only=True)

    items = SaleItemSerializer(
        many=True,
        write_only=True,
        required=True
    )

    items_detail = SaleItemSerializer(
        source="items",
        many=True,
        read_only=True
    )

    total_items = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        fields = "__all__"

    def get_total_items(self, obj):
        return obj.items.count()

    def create(self, validated_data):

        items_data = validated_data.pop("items")

        sale = Sale.objects.create(**validated_data)

        subtotal = 0

        for item in items_data:

            laptop = item["laptop"]

            # Default price from laptop
            sale_price = item.get("sale_price")

            if not sale_price:
                sale_price = laptop.price

            if laptop.status != "AVAILABLE":
                raise serializers.ValidationError(
                    f"Laptop {laptop.serial_number} is not available."
                )

            # Update laptop status
            laptop.status = "SOLD"
            laptop.customer = sale.customer
            laptop.save()

            # Create Stock Movement
            StockMovement.objects.create(
                laptop=laptop,
                movement_type="SOLD",
                quantity=1,
                remarks=f"Laptop sold via Sale #{sale.id}"
            )

            # Create Sale Item — save() will auto-populate snapshot fields
            SaleItem.objects.create(
                sale=sale,
                laptop=laptop,
                sale_price=sale_price
            )

            subtotal += float(sale_price)

        gst_amount = (subtotal * float(sale.gst)) / 100 if sale.gst else 0

        sale.subtotal = subtotal
        sale.total_amount = subtotal + gst_amount
        sale.save()

        return sale