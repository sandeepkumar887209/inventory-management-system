from django.db import models
from apps.common.models import AuditModel


class Customer(AuditModel):

    TYPE = [
        ('individual', 'Individual'),
        ('company',    'Company'),
    ]

    # ─── Core ────────────────────────────────────────────────────────────────

    name           = models.CharField(max_length=255)
    customer_type  = models.CharField(max_length=20, choices=TYPE, db_index=True)

    # ─── Contact ─────────────────────────────────────────────────────────────

    phone          = models.CharField(max_length=20)
    alternate_phone= models.CharField(max_length=20, blank=True, null=True)
    email          = models.EmailField(blank=True, null=True)
    address        = models.TextField(blank=True)
    city           = models.CharField(max_length=100, blank=True)
    state          = models.CharField(max_length=100, blank=True)
    pincode        = models.CharField(max_length=10,  blank=True)

    # ─── Company-specific ────────────────────────────────────────────────────
    # These are only relevant when customer_type == 'company'.
    # Kept as nullable so individual customers don't require them.

    company_name            = models.CharField(max_length=255, blank=True, null=True,
                                               help_text="Legal registered company name")
    contact_person          = models.CharField(max_length=255, blank=True, null=True,
                                               help_text="Primary point of contact at the company")
    contact_person_phone    = models.CharField(max_length=20,  blank=True, null=True)
    contact_person_email    = models.EmailField(blank=True, null=True)
    designation             = models.CharField(max_length=100, blank=True, null=True,
                                               help_text="Designation of the contact person")

    # Tax / Legal identifiers
    gst_number      = models.CharField(max_length=20,  blank=True, null=True,
                                       help_text="GSTIN — 15-character alphanumeric")
    pan_number      = models.CharField(max_length=10,  blank=True, null=True,
                                       help_text="PAN — 10-character alphanumeric")
    cin_number      = models.CharField(max_length=21,  blank=True, null=True,
                                       help_text="CIN — Corporate Identification Number (21 chars)")
    tan_number      = models.CharField(max_length=10,  blank=True, null=True,
                                       help_text="TAN — Tax Deduction Account Number")
    udyam_number    = models.CharField(max_length=19,  blank=True, null=True,
                                       help_text="Udyam Registration Number for MSMEs")
    trade_name      = models.CharField(max_length=255, blank=True, null=True,
                                       help_text="Trade name if different from legal name")

    # ─── Individual-specific ─────────────────────────────────────────────────

    aadhar_number   = models.CharField(max_length=12,  blank=True, null=True,
                                       help_text="Aadhaar number (12 digits)")
    pan_number_individual = models.CharField(max_length=10, blank=True, null=True,
                                             help_text="PAN for individual customers")

    # ─── Business meta ───────────────────────────────────────────────────────

    industry        = models.CharField(max_length=100, blank=True, null=True,
                                       help_text="e.g. IT, Manufacturing, Education")
    employee_count  = models.PositiveIntegerField(blank=True, null=True,
                                                  help_text="Approximate number of employees")
    website         = models.URLField(blank=True, null=True)
    credit_limit    = models.DecimalField(max_digits=12, decimal_places=2,
                                          blank=True, null=True,
                                          help_text="Maximum credit extended to this customer (₹)")
    credit_period_days = models.PositiveIntegerField(blank=True, null=True,
                                                     help_text="Payment due within N days")

    # ─── Internal ────────────────────────────────────────────────────────────

    notes           = models.TextField(blank=True, help_text="Internal notes, not shown to customer")
    is_active       = models.BooleanField(default=True, db_index=True)

    # Kept for backward compatibility / arbitrary extra data
    extra_details   = models.JSONField(default=dict, blank=True)

    # ─── Meta ────────────────────────────────────────────────────────────────

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Customer'
        verbose_name_plural = 'Customers'

    def __str__(self):
        return self.name

    # ─── Helpers ─────────────────────────────────────────────────────────────

    @property
    def is_company(self):
        return self.customer_type == 'company'

    @property
    def display_name(self):
        """Returns trade name if set, otherwise name."""
        return self.trade_name or self.name

    @property
    def full_address(self):
        parts = [p for p in [self.address, self.city, self.state, self.pincode] if p]
        return ', '.join(parts)


class CustomerHistory(AuditModel):
    """
    Immutable audit trail for every significant event on a customer.
    Never updated — only appended (like LaptopHistory).
    Written automatically via signals whenever Rental / Demo / Sale changes.
    """

    ACTION_CHOICES = (
        # Account lifecycle
        ("CUSTOMER_CREATED",  "Customer Created"),
        ("PROFILE_UPDATED",   "Profile Updated"),
        ("DEACTIVATED",       "Customer Deactivated"),
        ("REACTIVATED",       "Customer Reactivated"),
        # Rental events
        ("RENTAL_OUT",        "Laptop Rented Out"),
        ("RENTAL_RETURNED",   "Rental Returned"),
        ("RENTAL_REPLACED",   "Rental Replaced"),
        # Demo events
        ("DEMO_OUT",          "Demo Assigned"),
        ("DEMO_RETURNED",     "Demo Returned"),
        ("DEMO_CONVERTED",    "Demo Converted"),
        # Sale events
        ("SALE",              "Laptop Sold"),
        ("SALE_RETURNED",     "Sale Returned"),
    )

    customer    = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="history",
    )
    action      = models.CharField(max_length=30, choices=ACTION_CHOICES, db_index=True)

    # Snapshot of the laptop involved (if any) — preserved even if records change
    laptop_name = models.CharField(max_length=200, blank=True)
    serial      = models.CharField(max_length=100, blank=True)

    # Reference to the originating transaction
    ref_id      = models.PositiveIntegerField(null=True, blank=True)
    ref_label   = models.CharField(max_length=50, blank=True, help_text="e.g. R-12, D-5, S-8")

    # Financial
    amount      = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    # Human-readable summary
    note        = models.TextField(blank=True)

    # Actual business date (e.g. rental date, not row creation date)
    event_date  = models.DateField(null=True, blank=True, db_index=True)

    class Meta:
        ordering = ["-event_date", "-created_at"]
        verbose_name        = "Customer History"
        verbose_name_plural = "Customer Histories"

    def __str__(self):
        return f"{self.customer.name} — {self.action} ({self.event_date})"