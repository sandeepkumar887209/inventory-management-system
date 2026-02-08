from rest_framework import serializers
from apps.rentals.models import Rental
from apps.customers.models import Customer
from apps.inventory.models import Laptop


class CustomerMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ["id", "name"]


class LaptopMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Laptop
        fields = ["id", "brand", "model"]


class RentalSerializer(serializers.ModelSerializer):
    customer = CustomerMiniSerializer(read_only=True)
    laptop = LaptopMiniSerializer(read_only=True)

    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(),
        source="customer",
        write_only=True
    )

    laptop_id = serializers.PrimaryKeyRelatedField(
        queryset=Laptop.objects.all(),
        source="laptop",
        write_only=True
    )

    class Meta:
        model = Rental
        fields = [
            "id",
            "customer",
            "customer_id",
            "laptop",
            "laptop_id",
            "status",
            "created_at"
        ]
