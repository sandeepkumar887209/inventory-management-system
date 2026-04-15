"""
apps/rentals/models.py — with laptop snapshot on RentalItem
"""

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

    parent_rental = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="history"
    )

    rent_date            = models.DateField(auto_now_add=True)
    expected_return_date = models.DateField()
    actual_return_date   = models.DateField(null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="ONGOING"
    )

    subtotal     = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    gst          = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"Rental #{self.id}"


class RentalItem(AuditModel):
    """
    One row per laptop per rental.

    All laptop fields are snapshotted at the time of rental so that even
    if the laptop record changes later (specs upgrade, price change, etc.)
    the rental history remains accurate.
    """

    rental = models.ForeignKey(
        Rental,
        on_delete=models.CASCADE,
        related_name="items"
    )

    # ── FK to live Laptop (may become NULL if laptop is deleted; unlikely) ──
    laptop = models.ForeignKey(
        Laptop,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    # ── Price at time of rental ──────────────────────────────────────────
    rent_price = models.DecimalField(max_digits=10, decimal_places=2)

    # ─────────────────────────────────────────────────────────────────────
    # SNAPSHOT FIELDS — populated automatically on save (see save() below)
    # These let you reconstruct the full rental history even if the laptop
    # record is later modified or written-off.
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
    snapshot_list_price    = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    snapshot_rent_per_month= models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Supplier / purchase
    snapshot_purchased_from = models.CharField(max_length=150, blank=True)

    # Customer snapshot — denormalised for easy lookup without extra JOINs
    snapshot_customer_name  = models.CharField(max_length=255, blank=True)

    # ── Computed helper ──────────────────────────────────────────────────
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
            # Only snapshot once — at creation time
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
            self.snapshot_rent_per_month = l.rent_per_month
            self.snapshot_purchased_from = getattr(l, "purchased_from", "") or ""

        # Snapshot customer name from the parent Rental (snapshot once at creation)
        if self.rental_id and not self.snapshot_customer_name:
            customer = self.rental.customer
            self.snapshot_customer_name = str(customer) if customer else ""

        super().save(*args, **kwargs)

    def __str__(self):
        return self.serial or f"RentalItem #{self.id}"