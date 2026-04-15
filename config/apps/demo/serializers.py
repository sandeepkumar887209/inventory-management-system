"""
apps/demo/serializers.py — with laptop + customer snapshot support
"""

from rest_framework import serializers
from .models import Demo, DemoItem
from apps.inventory.models import Laptop, StockMovement
from apps.customers.models import Customer


class CustomerNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Customer
        fields = ("id", "name", "phone", "email", "customer_type")


class LaptopNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Laptop
        fields = ("id", "brand", "model", "serial_number", "processor",
                  "ram", "storage", "status", "rent_per_month")


class DemoItemSerializer(serializers.ModelSerializer):
    laptop    = LaptopNestedSerializer(read_only=True)
    laptop_id = serializers.PrimaryKeyRelatedField(
        queryset=Laptop.objects.all(),
        source="laptop",
        write_only=True
    )

    # Parent demo context — needed by the ledger
    demo_id              = serializers.IntegerField(source="demo.id",               read_only=True)
    demo_status          = serializers.CharField(source="demo.status",              read_only=True)
    assigned_date        = serializers.DateField(source="demo.assigned_date",       read_only=True)
    expected_return_date = serializers.DateField(source="demo.expected_return_date",read_only=True)
    actual_return_date   = serializers.DateField(source="demo.actual_return_date",  read_only=True)

    # Convenience read-only helpers built from the snapshot
    display_name = serializers.ReadOnlyField()
    serial       = serializers.ReadOnlyField()

    class Meta:
        model  = DemoItem
        fields = [
            "id",
            # FK / live
            "laptop", "laptop_id",
            # parent demo context
            "demo_id", "demo_status", "assigned_date", "expected_return_date", "actual_return_date",
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
            "demo_id", "demo_status", "assigned_date", "expected_return_date", "actual_return_date",
            "snapshot_brand", "snapshot_model", "snapshot_serial_number",
            "snapshot_asset_tag", "snapshot_processor", "snapshot_generation",
            "snapshot_ram", "snapshot_storage", "snapshot_gpu", "snapshot_display",
            "snapshot_os", "snapshot_color", "snapshot_condition",
            "snapshot_list_price", "snapshot_rent_per_month", "snapshot_purchased_from",
            "snapshot_customer_name",
            "display_name", "serial",
        ]


class DemoSerializer(serializers.ModelSerializer):
    customer_detail = CustomerNestedSerializer(source="customer", read_only=True)

    items = DemoItemSerializer(
        many=True,
        write_only=True,
        required=False
    )
    items_detail = DemoItemSerializer(
        source="items",
        many=True,
        read_only=True
    )

    total_items = serializers.SerializerMethodField()

    class Meta:
        model  = Demo
        fields = "__all__"

    def get_total_items(self, obj):
        return obj.items.count()

    # ── Validate rating ──────────────────────────────────────────────────
    def validate_feedback_rating(self, value):
        if value is not None and not (1 <= value <= 5):
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    # ── Create ───────────────────────────────────────────────────────────
    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        demo = Demo.objects.create(**validated_data)

        for item in items_data:
            laptop = item["laptop"]

            if laptop.status not in ("AVAILABLE",):
                raise serializers.ValidationError(
                    f"Laptop {laptop.serial_number} is not available for demo."
                )

            # Mark laptop as DEMO
            laptop.status   = "DEMO"
            laptop.customer = demo.customer
            laptop.save()

            StockMovement.objects.create(
                laptop=laptop,
                movement_type="OUT",
                quantity=1,
                remarks=f"Demo #{demo.id} — assigned for demo"
            )

            # DemoItem.save() will auto-populate snapshot fields
            DemoItem.objects.create(demo=demo, laptop=laptop)

        return demo
