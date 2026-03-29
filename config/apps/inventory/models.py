from django.db import models
from apps.common.models import AuditModel
from apps.customers.models import Customer


class Supplier(AuditModel):
    """Track suppliers so laptops can be returned to them."""
    name         = models.CharField(max_length=200)
    phone        = models.CharField(max_length=20, blank=True)
    email        = models.EmailField(blank=True)
    address      = models.TextField(blank=True)
    gst_number   = models.CharField(max_length=50, blank=True)
    notes        = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Laptop(AuditModel):
    STATUS_CHOICES = (
        ("AVAILABLE",            "Available"),
        ("RENTED",               "Rented"),
        ("SOLD",                 "Sold"),
        ("DEMO",                 "Demo"),
        ("UNDER_MAINTENANCE",    "Under Maintenance"),
        ("RETURNED_TO_SUPPLIER", "Returned to Supplier"),
        ("WRITTEN_OFF",          "Written Off"),
    )

    CONDITION_CHOICES = (
        ("NEW",  "New"),
        ("GOOD", "Good"),
        ("FAIR", "Fair"),
        ("POOR", "Poor"),
    )

    # ── Identity ──────────────────────────────────────
    asset_tag     = models.CharField(
        max_length=50, unique=True, blank=True,
        help_text="Internal asset tag e.g. LT-0001",
    )
    brand         = models.CharField(max_length=100)
    model         = models.CharField(max_length=100)
    serial_number = models.CharField(max_length=100, unique=True)

    # ── Specs ─────────────────────────────────────────
    processor    = models.CharField(max_length=100)
    generation   = models.CharField(max_length=100)
    ram          = models.CharField(max_length=50)
    storage      = models.CharField(max_length=50)
    gpu          = models.CharField(
        max_length=150, blank=True,
        verbose_name="GPU / Graphics Card",
        help_text="e.g. NVIDIA GeForce RTX 4060, Intel Iris Xe, AMD Radeon RX 7600M",
    )
    display_size = models.CharField(
        max_length=20, blank=True,
        help_text="e.g. 15.6 inch",
    )
    os    = models.CharField(
        max_length=100, blank=True,
        help_text="e.g. Windows 11 Pro",
    )
    color = models.CharField(max_length=50, blank=True)

    # ── Purchase ──────────────────────────────────────
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="laptops",
    )
    purchased_from  = models.CharField(max_length=150, blank=True)   # kept for legacy
    purchase_date   = models.DateField(null=True, blank=True)
    purchase_price  = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cost_to_company = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    warranty_expiry = models.DateField(null=True, blank=True)
    invoice_number  = models.CharField(max_length=100, blank=True)
    condition       = models.CharField(max_length=20, choices=CONDITION_CHOICES, default="NEW")

    # ── Pricing ───────────────────────────────────────
    price          = models.DecimalField(max_digits=10, decimal_places=2)   # sale price
    rent_per_month = models.DecimalField(max_digits=10, decimal_places=2)

    # ── Current holder ────────────────────────────────
    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="current_laptops",
    )

    # ── Lifecycle ─────────────────────────────────────
    status         = models.CharField(max_length=30, choices=STATUS_CHOICES, default="AVAILABLE")
    description    = models.JSONField(default=dict)
    internal_notes = models.TextField(blank=True)

    # ── NEVER DELETE philosophy ───────────────────────
    # Laptops are NEVER deleted. When a laptop leaves the business it gets one of:
    #   SOLD              → sold to a customer
    #   RETURNED_TO_SUPPLIER → sent back to supplier
    #   WRITTEN_OFF       → damaged beyond repair / scrapped
    # The full history lives in LaptopHistory + StockMovement.

    class Meta:
        unique_together = ("brand", "model", "serial_number")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.brand} {self.model} ({self.serial_number})"


class LaptopHistory(AuditModel):
    """
    Immutable audit trail for every status change on a laptop.
    Never updated, only appended.
    """
    ACTION_CHOICES = (
        ("ADDED",                "Added to Inventory"),
        ("RENTED_OUT",           "Rented Out"),
        ("RETURNED",             "Returned by Customer"),
        ("SOLD",                 "Sold"),
        ("SENT_FOR_MAINTENANCE", "Sent for Maintenance"),
        ("MAINTENANCE_DONE",     "Maintenance Done"),
        ("RETURNED_TO_SUPPLIER", "Returned to Supplier"),
        ("WRITTEN_OFF",          "Written Off"),
        ("STATUS_CHANGED",       "Status Changed"),
        ("SPECS_UPDATED",        "Specs Updated"),
    )

    laptop       = models.ForeignKey(Laptop, on_delete=models.CASCADE, related_name="history")
    action       = models.CharField(max_length=30, choices=ACTION_CHOICES)
    from_status  = models.CharField(max_length=30, blank=True)
    to_status    = models.CharField(max_length=30, blank=True)
    customer     = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True)
    remarks      = models.TextField(blank=True)
    reference_id = models.CharField(max_length=100, blank=True, help_text="Rental ID / Sale ID / etc.")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.laptop.serial_number} — {self.action}"


class StockMovement(AuditModel):
    MOVEMENT_TYPE = (
        ("IN",               "Stock In"),
        ("OUT",              "Stock Out — Rental"),
        ("RETURN",           "Returned by Customer"),
        ("SOLD",             "Sold"),
        ("MAINTENANCE_OUT",  "Sent for Maintenance"),
        ("MAINTENANCE_IN",   "Returned from Maintenance"),
        ("SUPPLIER_RETURN",  "Returned to Supplier"),
        ("WRITTEN_OFF",      "Written Off"),
    )

    laptop        = models.ForeignKey(Laptop, on_delete=models.CASCADE, related_name="movements")
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPE)
    quantity      = models.PositiveIntegerField(default=1)
    remarks       = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.movement_type} — {self.laptop.serial_number}"