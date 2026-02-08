from django.db import models
from apps.common.models import AuditModel


class Laptop(AuditModel):
    STATUS_CHOICES = (
        ("AVAILABLE", "Available"),
        ("RENTED", "Rented"),
        ("SOLD", "Sold"),
        ("SCRAP", "Scrap"),
    )

    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    serial_number = models.CharField(max_length=100, unique=True)

    specs = models.JSONField(default=dict)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="AVAILABLE"
    )

    class Meta:
        unique_together = ("brand", "model", "serial_number")

    def __str__(self):
        return f"{self.brand} {self.model} ({self.serial_number})"


class StockMovement(AuditModel):
    MOVEMENT_TYPE = (
        ("IN", "Stock In"),
        ("OUT", "Stock Out"),
        ("RETURN", "Returned"),
        ("DAMAGE", "Damaged"),
    )

    laptop = models.ForeignKey(
        Laptop,
        on_delete=models.CASCADE,
        related_name="movements"
    )

    movement_type = models.CharField(
        max_length=10,
        choices=MOVEMENT_TYPE
    )

    quantity = models.PositiveIntegerField(default=1)

    remarks = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.movement_type} - {self.laptop.serial_number}"
