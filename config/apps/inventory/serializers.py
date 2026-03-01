from rest_framework import serializers
from .models import Laptop, StockMovement
from apps.customers.models import Customer

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ("id", "name", "phone", "email")


class LaptopSerializer(serializers.ModelSerializer):
    # Nested customer info
    customer_detail = CustomerSerializer(source="customer", read_only=True)

    class Meta:
        model = Laptop
        fields = '__all__'
        read_only_fields = (
            'created_by', 'updated_by', 'created_at', 'updated_at'
        )


class StockMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockMovement
        fields = "__all__"

    def create(self, validated_data):
        laptop = validated_data["laptop"]
        movement_type = validated_data["movement_type"]

        # Update laptop status based on movement
        if movement_type == "IN":
            laptop.status = "AVAILABLE"
            laptop.customer = None
        elif movement_type == "OUT":
            laptop.status = "RENTED"
        elif movement_type == "RETURN":
            laptop.status = "AVAILABLE"
            laptop.customer = None
        elif movement_type == "DAMAGE":
            laptop.status = "SCRAP"

        laptop.save()
        return super().create(validated_data)