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

    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name="rentals")
    rent_date = models.DateField(auto_now_add=True)
    expected_return_date = models.DateField()
    actual_return_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="ONGOING")

    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    gst = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"Rental #{self.id}"


class RentalItem(AuditModel):
    rental = models.ForeignKey(Rental, on_delete=models.CASCADE, related_name="items")
    laptop = models.ForeignKey(Laptop, on_delete=models.PROTECT)
    rent_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.laptop.serial_number}"


class RentalReturn(models.Model):
    rental = models.ForeignKey(Rental, on_delete=models.CASCADE, related_name="returns")
    laptop = models.ForeignKey(Laptop, on_delete=models.CASCADE)
    return_date = models.DateField(auto_now_add=True)


class RentalReplacement(models.Model):
    rental = models.ForeignKey(Rental, on_delete=models.CASCADE, related_name="replacements")
    old_laptop = models.ForeignKey(Laptop, on_delete=models.CASCADE, related_name="old_laptop")
    new_laptop = models.ForeignKey(Laptop, on_delete=models.CASCADE, related_name="new_laptop")
    date = models.DateField(auto_now_add=True)