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

    subtotal     = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    gst          = models.DecimalField(max_digits=5,  decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"Sale #{self.id}"


class SaleItem(AuditModel):

    sale = models.ForeignKey(
        Sale,
        on_delete=models.CASCADE,
        related_name="items"
    )

    # FK to live Laptop (SET_NULL so history survives if laptop deleted)
    laptop = models.ForeignKey(
        Laptop,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    sale_price = models.DecimalField(max_digits=10, decimal_places=2)

    # ─────────────────────────────────────────────────────────────────────
    # SNAPSHOT FIELDS — populated automatically on save (see save() below)
    # ─────────────────────────────────────────────────────────────────────

    # Identity
    snapshot_brand         = models.CharField(max_length=100, blank=True)
    snapshot_model         = models.CharField(max_length=100, blank=True)
    snapshot_serial_number = models.CharField(max_length=100, blank=True)
    snapshot_asset_tag     = models.CharField(max_length=50,  blank=True)

    # Specs
    snapshot_processor  = models.CharField(max_length=100, blank=True)
    snapshot_generation = models.CharField(max_length=100, blank=True)
    snapshot_ram        = models.CharField(max_length=50,  blank=True)
    snapshot_storage    = models.CharField(max_length=50,  blank=True)
    snapshot_gpu        = models.CharField(max_length=150, blank=True)
    snapshot_display    = models.CharField(max_length=20,  blank=True)
    snapshot_os         = models.CharField(max_length=100, blank=True)
    snapshot_color      = models.CharField(max_length=50,  blank=True)
    snapshot_condition  = models.CharField(max_length=20,  blank=True)

    # Pricing snapshot
    snapshot_list_price     = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Supplier / purchase
    snapshot_purchased_from = models.CharField(max_length=150, blank=True)

    # Customer snapshot — denormalised for easy lookup without extra JOINs
    snapshot_customer_name  = models.CharField(max_length=255, blank=True)

    # ── Computed helpers ─────────────────────────────────────────────────
    @property
    def display_name(self):
        brand = self.snapshot_brand or (self.laptop.brand if self.laptop else "")
        model = self.snapshot_model or (self.laptop.model if self.laptop else "")
        return f"{brand} {model}".strip() or "Unknown Laptop"

    @property
    def serial(self):
        return self.snapshot_serial_number or (self.laptop.serial_number if self.laptop else "")

    def save(self, *args, **kwargs):
        """Populate snapshot fields from the live laptop and customer on first save."""
        if self.laptop_id and not self.snapshot_serial_number:
            l = self.laptop
            self.snapshot_brand          = l.brand
            self.snapshot_model          = l.model
            self.snapshot_serial_number  = l.serial_number
            self.snapshot_asset_tag      = l.asset_tag or ""
            self.snapshot_processor      = l.processor
            self.snapshot_generation     = l.generation or ""
            self.snapshot_ram            = l.ram
            self.snapshot_storage        = l.storage
            self.snapshot_gpu            = getattr(l, "gpu", "") or ""
            self.snapshot_display        = getattr(l, "display_size", "") or ""
            self.snapshot_os             = getattr(l, "os", "") or ""
            self.snapshot_color          = getattr(l, "color", "") or ""
            self.snapshot_condition      = getattr(l, "condition", "") or ""
            self.snapshot_list_price     = getattr(l, "price", None)
            self.snapshot_purchased_from = getattr(l, "purchased_from", "") or ""

        if self.sale_id and not self.snapshot_customer_name:
            customer = self.sale.customer
            self.snapshot_customer_name = str(customer) if customer else ""

        super().save(*args, **kwargs)

    def __str__(self):
        return self.serial or f"SaleItem #{self.id}"