from django.db import models
from apps.common.models import AuditModel
from apps.inventory.models import Laptop
from apps.customers.models import Customer


class Sale(AuditModel):

    STATUS_CHOICES = (
        ("COMPLETED", "Completed"),
        ("RETURNED", "Returned"),
    )

    customer = models.ForeignKey(
        Customer,
        on_delete=models.PROTECT,
        related_name="sales"
    )

    sale_date = models.DateField(auto_now_add=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="COMPLETED"
    )

    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    gst = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"Sale #{self.id}"


class SaleItem(AuditModel):

    sale = models.ForeignKey(
        Sale,
        on_delete=models.CASCADE,
        related_name="items"
    )

    laptop = models.ForeignKey(
        Laptop,
        on_delete=models.PROTECT
    )

    sale_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.laptop.serial_number}"