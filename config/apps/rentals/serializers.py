from rest_framework import serializers
from .models import Rental, RentalItem, RentalReturn, RentalReplacement
from apps.inventory.models import StockMovement
from apps.inventory.models import Laptop
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
    # ✅ Correct nested customer
    customer_detail = CustomerNestedSerializer(source="customer", read_only=True)

    # Items
    items = RentalItemSerializer(many=True, write_only=True)
    items_detail = RentalItemSerializer(source="items", many=True, read_only=True)

    total_items = serializers.SerializerMethodField()
    total_returned = serializers.SerializerMethodField()
    total_replaced = serializers.SerializerMethodField()

    class Meta:
        model = Rental
        fields = "__all__"

    def get_total_items(self, obj):
        return obj.items.count()

    def get_total_returned(self, obj):
        return obj.returns.count()

    def get_total_replaced(self, obj):
        return obj.replacements.count()

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        rental = Rental.objects.create(**validated_data)

        subtotal = 0

        for item in items_data:
            laptop = item["laptop"]
            rent_price = item["rent_price"]

            subtotal += rent_price

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

        gst_amount = (subtotal * rental.gst) / 100
        rental.subtotal = subtotal
        rental.total_amount = subtotal + gst_amount
        rental.save()

        return rental

class RentalReturnSerializer(serializers.ModelSerializer):
    class Meta:
        model = RentalReturn
        fields = "__all__"

    def validate(self, data):
        rental = data["rental"]
        laptop = data["laptop"]

        # ✅ Ensure laptop belongs to rental
        if not rental.items.filter(laptop=laptop).exists():
            raise serializers.ValidationError(
                "This laptop does not belong to this rental."
            )

        return data

    def create(self, validated_data):
        rental_return = RentalReturn.objects.create(**validated_data)

        rental = rental_return.rental
        laptop = rental_return.laptop

        laptop.status = "AVAILABLE"
        laptop.save()

        StockMovement.objects.create(
            laptop=laptop,
            movement_type="RETURN",
            quantity=1,
            remarks=f"Returned Rental #{rental.id}"
        )

        # ✅ If all returned → mark returned
        if rental.items.count() == rental.returns.count():
            rental.status = "RETURNED"
            rental.actual_return_date = rental_return.return_date
            rental.save()

        return rental_return

class RentalReplacementSerializer(serializers.ModelSerializer):
    class Meta:
        model = RentalReplacement
        fields = "__all__"

    def validate(self, data):
        rental = data["rental"]
        old_laptop = data["old_laptop"]

        if not rental.items.filter(laptop=old_laptop).exists():
            raise serializers.ValidationError(
                "Old laptop does not belong to this rental."
            )

        return data

    def create(self, validated_data):
        replacement = RentalReplacement.objects.create(**validated_data)

        rental = replacement.rental

        # Old laptop available
        replacement.old_laptop.status = "AVAILABLE"
        replacement.old_laptop.save()

        StockMovement.objects.create(
            laptop=replacement.old_laptop,
            movement_type="RETURN",
            quantity=1,
            remarks=f"Replacement Rental #{rental.id}"
        )

        # New laptop rented
        replacement.new_laptop.status = "RENTED"
        replacement.new_laptop.save()

        StockMovement.objects.create(
            laptop=replacement.new_laptop,
            movement_type="OUT",
            quantity=1,
            remarks=f"Replacement Rental #{rental.id}"
        )

        rental.status = "REPLACED"
        rental.save()

        return replacement