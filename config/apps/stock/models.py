from django.db import models
from apps.common.models import AuditModel
from apps.inventory.models import Laptop

class StockMovement(AuditModel):
    IN = 'IN'
    OUT = 'OUT'
    RETURN = 'RETURN'
    ADJUST = 'ADJUST'

    MOVEMENT_CHOICES = [
        (IN, 'In'),
        (OUT, 'Out'),
        (RETURN, 'Return'),
        (ADJUST, 'Adjust'),
    ]

    laptop = models.ForeignKey(
        Laptop,
        on_delete=models.CASCADE,
        related_name='stock_movements'
    )
    movement_type = models.CharField(
        max_length=10,
        choices=MOVEMENT_CHOICES
    )
    quantity = models.PositiveIntegerField()
    remarks = models.TextField(blank=True)

    def __str__(self):
        return f"{self.movement_type} | {self.laptop} | {self.quantity}"
