from django.db import models
from apps.common.models import AuditModel
from apps.inventory.models import Laptop
from apps.customers.models import Customer


class Rental(AuditModel):
    RENTAL_STATUS = (
        ("ONGOING", "Ongoing"),
        ("RETURNED", "Returned"),
    )

    laptop = models.ForeignKey(
        Laptop,
        on_delete=models.PROTECT,
        related_name="rentals"
    )

    customer = models.ForeignKey(
        Customer,
        on_delete=models.PROTECT,
        related_name="rentals"
    )

    rent_date = models.DateField(auto_now_add=True)
    expected_return_date = models.DateField()
    actual_return_date = models.DateField(null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=RENTAL_STATUS,
        default="ONGOING"
    )
    rental_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    def __str__(self):
        return f"{self.laptop} → {self.customer}"
