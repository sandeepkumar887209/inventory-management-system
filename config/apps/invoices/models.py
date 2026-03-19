from django.db import models
from apps.customers.models import Customer
from apps.inventory.models import Laptop


class Invoice(models.Model):

    INVOICE_TYPE = (
        ("SALE", "Sale"),
        ("RENTAL", "Rental"),
        ("CUSTOM", "Custom"),
    )

    STATUS_CHOICES = (
        ("UNPAID", "Unpaid"),
        ("PAID", "Paid"),
        ("PARTIAL", "Partial"),
        ("CANCELLED", "Cancelled"),
    )

    invoice_number = models.CharField(max_length=50, unique=True)

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="invoices"
    )

    invoice_type = models.CharField(
        max_length=20,
        choices=INVOICE_TYPE,
        default="SALE"
    )

    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    gst = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=18
    )

    gst_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="UNPAID"
    )

    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.invoice_number


class InvoiceItem(models.Model):

    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name="items"
    )

    laptop = models.ForeignKey(
        Laptop,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    description = models.CharField(max_length=255)

    quantity = models.IntegerField(default=1)

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    def save(self, *args, **kwargs):
        self.total = self.quantity * self.price
        super().save(*args, **kwargs)

    def __str__(self):
        return self.description