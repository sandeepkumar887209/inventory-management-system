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
    laptop = InventoryNestedSerializer(read_only=True)
    laptop_id = serializers.PrimaryKeyRelatedField(
        queryset=Laptop.objects.all(),
        source="laptop",
        write_only=True
    )

    class Meta:
        model = RentalItem
        fields = ["id", "laptop", "laptop_id", "rent_price"]


class RentalSerializer(serializers.ModelSerializer):
    customer_detail = CustomerNestedSerializer(source="customer", read_only=True)

    items = RentalItemSerializer(many=True, write_only=True)
    items_detail = RentalItemSerializer(source="items", many=True, read_only=True)

    total_items = serializers.SerializerMethodField()

    class Meta:
        model = Rental
        fields = "__all__"

    def get_total_items(self, obj):
        return obj.items.count()

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        rental = Rental.objects.create(**validated_data)

        subtotal = 0

        for item in items_data:
            laptop = item["laptop"]
            rent_price = item["rent_price"]

            if laptop.status != "AVAILABLE":
                raise serializers.ValidationError(
                    f"Laptop {laptop.serial_number} not available."
                )

            laptop.status = "RENTED"
            laptop.save()

            StockMovement.objects.create(
                laptop=laptop,
                movement_type="OUT",
                quantity=1,
                remarks=f"Rental #{rental.id}"
            )

            RentalItem.objects.create(
                rental=rental,
                laptop=laptop,
                rent_price=rent_price
            )

            subtotal += rent_price

        gst_amount = (subtotal * rental.gst) / 100
        rental.subtotal = subtotal
        rental.total_amount = subtotal + gst_amount
        rental.save()

        return rental