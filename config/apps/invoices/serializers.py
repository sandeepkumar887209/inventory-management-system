from rest_framework import serializers
from .models import Invoice, InvoiceItem
from apps.customers.models import Customer
from apps.inventory.models import Laptop


class CustomerNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = "__all__"


class LaptopNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Laptop
        fields = "__all__"


class InvoiceItemSerializer(serializers.ModelSerializer):
    laptop = LaptopNestedSerializer(read_only=True)
    laptop_id = serializers.PrimaryKeyRelatedField(
        queryset=Laptop.objects.all(),
        source="laptop",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = InvoiceItem
        fields = ["id", "laptop", "laptop_id", "description", "quantity", "price", "total"]
        read_only_fields = ["total"]


class InvoiceSerializer(serializers.ModelSerializer):
    customer_detail = CustomerNestedSerializer(source="customer", read_only=True)
    items = InvoiceItemSerializer(many=True, write_only=True)
    items_detail = InvoiceItemSerializer(source="items", many=True, read_only=True)

    class Meta:
        model = Invoice
        fields = "__all__"

    def _recalculate(self, invoice):
        subtotal = sum(item.total for item in invoice.items.all())
        gst_amount = (subtotal * invoice.gst) / 100
        invoice.subtotal = subtotal
        invoice.gst_amount = gst_amount
        invoice.total_amount = subtotal + gst_amount
        invoice.save(update_fields=["subtotal", "gst_amount", "total_amount"])

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        invoice = Invoice.objects.create(**validated_data)

        for item in items_data:
            laptop = item.get("laptop", None)
            quantity = item["quantity"]
            price = item["price"]
            InvoiceItem.objects.create(
                invoice=invoice,
                laptop=laptop,
                description=item["description"],
                quantity=quantity,
                price=price,
                total=quantity * price,
            )

        self._recalculate(invoice)
        return invoice

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item in items_data:
                laptop = item.get("laptop", None)
                quantity = item["quantity"]
                price = item["price"]
                InvoiceItem.objects.create(
                    invoice=instance,
                    laptop=laptop,
                    description=item["description"],
                    quantity=quantity,
                    price=price,
                    total=quantity * price,
                )
            self._recalculate(instance)

        return instance