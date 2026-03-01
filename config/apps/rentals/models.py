from django.db import models
from apps.common.models import AuditModel
from apps.inventory.models import Laptop
from apps.customers.models import Customer


class Rental(AuditModel):
    STATUS_CHOICES = (
        ("ONGOING", "Ongoing"),
        ("RETURNED", "Returned"),
        ("REPLACED", "Replaced"),
    )

    customer = models.ForeignKey(
        Customer,
        on_delete=models.PROTECT,
        related_name="rentals"
    )

    # 🔥 History Link
    parent_rental = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="history"
    )

    rent_date = models.DateField(auto_now_add=True)
    expected_return_date = models.DateField()
    actual_return_date = models.DateField(null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="ONGOING"
    )

    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    gst = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"Rental #{self.id}"


class RentalItem(AuditModel):
    rental = models.ForeignKey(
        Rental,
        on_delete=models.CASCADE,
        related_name="items"
    )

    laptop = models.ForeignKey(
        Laptop,
        on_delete=models.PROTECT
    )

    rent_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.laptop.serial_number}"