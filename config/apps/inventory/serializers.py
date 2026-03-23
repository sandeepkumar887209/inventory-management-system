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
        fields = ("id", "name", "phone", "email", "customer_type")


class CreatedBySerializer(serializers.Serializer):
    id         = serializers.IntegerField()
    username   = serializers.CharField()
    first_name = serializers.CharField()
    last_name  = serializers.CharField()
    full_name  = serializers.SerializerMethodField()

    def get_full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name if name else obj.username


class LaptopHistorySerializer(serializers.ModelSerializer):
    # Nested customer object (not just FK id)
    customer_detail = CustomerBriefSerializer(source="customer", read_only=True)

    # Who performed the action
    performed_by = serializers.SerializerMethodField()

    # Human-readable action label
    action_label = serializers.SerializerMethodField()

    # Formatted datetime
    date = serializers.SerializerMethodField()

    class Meta:
        model  = LaptopHistory
        fields = [
            "id",
            "action",
            "action_label",
            "from_status",
            "to_status",
            "customer",          # raw FK (kept for backwards compat)
            "customer_detail",   # ← full nested object
            "remarks",
            "reference_id",
            "performed_by",
            "created_at",
            "date",
        ]
        read_only_fields = fields

    ACTION_LABELS = {
        "ADDED":                "Added to Inventory",
        "RENTED_OUT":           "Rented Out",
        "RETURNED":             "Returned by Customer",
        "SOLD":                 "Sold",
        "SENT_FOR_MAINTENANCE": "Sent for Maintenance",
        "MAINTENANCE_DONE":     "Maintenance Completed",
        "RETURNED_TO_SUPPLIER": "Returned to Supplier",
        "WRITTEN_OFF":          "Written Off",
        "STATUS_CHANGED":       "Status Changed",
        "SPECS_UPDATED":        "Specs Updated",
    }

    def get_action_label(self, obj):
        return self.ACTION_LABELS.get(obj.action, obj.action.replace("_", " ").title())

    def get_performed_by(self, obj):
        u = obj.created_by
        if not u:
            return None
        name = f"{u.first_name} {u.last_name}".strip()
        return {
            "id":       u.id,
            "username": u.username,
            "name":     name if name else u.username,
        }

    def get_date(self, obj):
        if not obj.created_at:
            return None
        return obj.created_at.strftime("%d %b %Y, %I:%M %p")


class StockMovementSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True)
    laptop_label    = serializers.SerializerMethodField()
    movement_label  = serializers.SerializerMethodField()

    class Meta:
        model  = StockMovement
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "created_by", "updated_by")

    MOVEMENT_LABELS = {
        "IN":              "Stock In",
        "OUT":             "Rented Out",
        "RETURN":          "Returned by Customer",
        "SOLD":            "Sold",
        "MAINTENANCE_OUT": "Sent for Maintenance",
        "MAINTENANCE_IN":  "Returned from Maintenance",
        "SUPPLIER_RETURN": "Returned to Supplier",
        "WRITTEN_OFF":     "Written Off",
    }

    def get_movement_label(self, obj):
        return self.MOVEMENT_LABELS.get(obj.movement_type, obj.movement_type)

    def get_laptop_label(self, obj):
        l = obj.laptop
        return f"{l.brand} {l.model} ({l.serial_number})"

    def create(self, validated_data):
        laptop        = validated_data["laptop"]
        movement_type = validated_data["movement_type"]

        STATUS_MAP = {
            "IN":              "AVAILABLE",
            "OUT":             "RENTED",
            "RETURN":          "AVAILABLE",
            "SOLD":            "SOLD",
            "MAINTENANCE_OUT": "UNDER_MAINTENANCE",
            "MAINTENANCE_IN":  "AVAILABLE",
            "SUPPLIER_RETURN": "RETURNED_TO_SUPPLIER",
            "WRITTEN_OFF":     "WRITTEN_OFF",
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
    """Lightweight serializer for list views."""
    customer_detail = CustomerBriefSerializer(source="customer", read_only=True)
    supplier_name   = serializers.CharField(source="supplier.name", read_only=True)

    class Meta:
        model  = Laptop
        fields = [
            "id", "asset_tag", "brand", "model", "serial_number",
            "processor", "generation", "ram", "storage",
            "display_size", "os", "color",
            "condition", "status",
            "price", "rent_per_month","cost_to_company", "purchase_price", "purchase_date",
            "warranty_expiry", "purchased_from", "supplier_name",
            "customer_detail",
            "created_at",
        ]
