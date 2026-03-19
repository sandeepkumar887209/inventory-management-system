from rest_framework import serializers
from .models import Laptop, LaptopHistory, StockMovement, Supplier
from apps.customers.models import Customer


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Supplier
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "created_by", "updated_by")


class CustomerBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Customer
        fields = ("id", "name", "phone", "email")


class LaptopHistorySerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True)

    class Meta:
        model  = LaptopHistory
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "created_by", "updated_by")


class StockMovementSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True)

    class Meta:
        model  = StockMovement
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "created_by", "updated_by")

    def create(self, validated_data):
        laptop        = validated_data["laptop"]
        movement_type = validated_data["movement_type"]

        STATUS_MAP = {
            "IN":               "AVAILABLE",
            "OUT":              "RENTED",
            "RETURN":           "AVAILABLE",
            "SOLD":             "SOLD",
            "MAINTENANCE_OUT":  "UNDER_MAINTENANCE",
            "MAINTENANCE_IN":   "AVAILABLE",
            "SUPPLIER_RETURN":  "RETURNED_TO_SUPPLIER",
            "WRITTEN_OFF":      "WRITTEN_OFF",
        }

        if movement_type in STATUS_MAP:
            laptop.status = STATUS_MAP[movement_type]
            if movement_type in ("RETURN", "MAINTENANCE_IN", "IN"):
                laptop.customer = None
            laptop.save()

        return super().create(validated_data)


class LaptopSerializer(serializers.ModelSerializer):
    customer_detail = CustomerBriefSerializer(source="customer", read_only=True)
    supplier_detail = SupplierSerializer(source="supplier", read_only=True)
    history_count   = serializers.SerializerMethodField()
    age_days        = serializers.SerializerMethodField()

    class Meta:
        model  = Laptop
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "created_by", "updated_by")

    def get_history_count(self, obj):
        return obj.history.count()

    def get_age_days(self, obj):
        if obj.purchase_date:
            from django.utils import timezone
            return (timezone.now().date() - obj.purchase_date).days
        return None


class LaptopListSerializer(serializers.ModelSerializer):
    """Lightweight for list views."""
    customer_detail = CustomerBriefSerializer(source="customer", read_only=True)
    supplier_name   = serializers.CharField(source="supplier.name", read_only=True)

    class Meta:
        model  = Laptop
        fields = [
            "id", "asset_tag", "brand", "model", "serial_number",
            "processor", "generation", "ram", "storage",
            "display_size", "os", "color",
            "condition", "status",
            "price", "rent_per_month", "purchase_price", "purchase_date",
            "warranty_expiry", "purchased_from", "supplier_name",
            "customer_detail",
            "created_at",
        ]