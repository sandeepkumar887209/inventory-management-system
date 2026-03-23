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

    class Meta:
        model  = DemoItem
        fields = ("id", "laptop", "laptop_id")


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

            DemoItem.objects.create(demo=demo, laptop=laptop)

        return demo
