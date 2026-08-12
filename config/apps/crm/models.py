from django.db import models
from django.contrib.auth.models import User
from apps.common.models import AuditModel
from apps.customers.models import Customer


# ─────────────────────────────────────────────
# ACCOUNT (Company)
# ─────────────────────────────────────────────
class Account(AuditModel):
    name = models.CharField(max_length=255)
    industry = models.CharField(max_length=100, blank=True)
    website = models.URLField(blank=True, null=True)
    employee_count = models.PositiveIntegerField(blank=True, null=True)
    annual_revenue = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_accounts")
    
    def __str__(self):
        return self.name

# ─────────────────────────────────────────────
# CONTACT (Person)
# ─────────────────────────────────────────────
class Contact(AuditModel):
    account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True, related_name="contacts")
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True)
    designation = models.CharField(max_length=100, blank=True)
    
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_contacts")
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip()

# ─────────────────────────────────────────────
# DEAL (Opportunity)
# ─────────────────────────────────────────────
class Deal(AuditModel):
    STAGE_CHOICES = [
        ("VALUE_PROPOSITION", "Value Proposition"),
        ("PROPOSAL_PRICE_QUOTE", "Proposal/Price Quote"),
        ("NEGOTIATION_REVIEW", "Negotiation/Review"),
        ("CLOSED_WON", "Closed Won"),
        ("CLOSED_LOST", "Closed Lost"),
    ]
    
    name = models.CharField(max_length=255)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name="deals", null=True, blank=True)
    contact = models.ForeignKey(Contact, on_delete=models.SET_NULL, null=True, blank=True, related_name="deals")
    
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    closing_date = models.DateField(null=True, blank=True)
    stage = models.CharField(max_length=30, choices=STAGE_CHOICES, default="VALUE_PROPOSITION")
    probability = models.PositiveIntegerField(default=10, help_text="Probability of winning (%)")
    
    expected_laptops = models.PositiveIntegerField(default=1)
    
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_deals")
    
    def __str__(self):
        return self.name

# ─────────────────────────────────────────────
# QUOTE
# ─────────────────────────────────────────────
class Quote(AuditModel):
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, related_name="quotes")
    quote_number = models.CharField(max_length=50, unique=True)
    valid_until = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=[("DRAFT", "Draft"), ("SENT", "Sent"), ("ACCEPTED", "Accepted"), ("REJECTED", "Rejected")], default="DRAFT")
    
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    notes = models.TextField(blank=True)
    terms = models.TextField(blank=True)
    
    def __str__(self):
        return self.quote_number

class QuoteLineItem(models.Model):
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name="line_items")
    item_name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    
    def __str__(self):
        return f"{self.quantity} x {self.item_name}"

# ─────────────────────────────────────────────
# LEAD
# ─────────────────────────────────────────────
class Lead(AuditModel):
    SOURCE_CHOICES = [
        ("WALK_IN", "Walk In"),
        ("REFERRAL", "Referral"),
        ("SOCIAL_MEDIA", "Social Media"),
        ("WEBSITE", "Website"),
        ("COLD_CALL", "Cold Call"),
        ("OTHER", "Other"),
    ]

    STATUS_CHOICES = [
        ("NEW", "New"),
        ("CONTACTED", "Contacted"),
        ("QUALIFIED", "Qualified"),
        ("CONVERTED", "Converted"),
        ("LOST", "Lost"),
    ]

    INTENT_CHOICES = [
        ("RENT", "Rent"),
        ("BUY", "Buy"),
        ("BOTH", "Both"),
    ]

    # Valid forward-only transitions (prevents going backwards)
    STATUS_ORDER = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"]

    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    company = models.CharField(max_length=255, blank=True)
    address = models.TextField(blank=True)

    source = models.CharField(max_length=30, choices=SOURCE_CHOICES, default="OTHER")
    intent = models.CharField(max_length=10, choices=INTENT_CHOICES, default="RENT")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="NEW")

    # Assigned salesperson
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_leads",
    )

    # If lead converts to a real customer
    converted_customer = models.OneToOneField(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="lead",
    )

    notes = models.TextField(blank=True)
    expected_laptops = models.PositiveIntegerField(default=1)
    budget = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    follow_up_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} [{self.status}]"


# ─────────────────────────────────────────────
# LEAD STATUS HISTORY
# ─────────────────────────────────────────────
class LeadStatusHistory(models.Model):
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name="status_history")
    from_status = models.CharField(max_length=20, blank=True)
    to_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="lead_status_changes",
    )
    note = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-changed_at"]

    def __str__(self):
        return f"{self.lead.name}: {self.from_status} → {self.to_status}"


# ─────────────────────────────────────────────
# ACTIVITY (calls, emails, visits, notes)
# ─────────────────────────────────────────────
class Activity(AuditModel):
    TYPE_CHOICES = [
        ("CALL", "Call"),
        ("EMAIL", "Email"),
        ("VISIT", "Visit"),
        ("MEETING", "Meeting"),
        ("NOTE", "Note"),
        ("WHATSAPP", "WhatsApp"),
    ]

    lead = models.ForeignKey(
        Lead,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="activities",
    )
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="activities",
    )
    account = models.ForeignKey(Account, on_delete=models.CASCADE, null=True, blank=True, related_name="activities")
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, null=True, blank=True, related_name="activities")
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, null=True, blank=True, related_name="activities")

    activity_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    summary = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    activity_date = models.DateTimeField()

    def __str__(self):
        target = self.lead or self.deal or self.account or self.contact or self.customer
        return f"{self.activity_type} - {target}"


# ─────────────────────────────────────────────
# FOLLOW-UP REMINDER
# ─────────────────────────────────────────────
class FollowUp(AuditModel):
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("DONE", "Done"),
        ("CANCELLED", "Cancelled"),
    ]

    lead = models.ForeignKey(
        Lead,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="follow_ups",
    )
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="follow_ups",
    )
    account = models.ForeignKey(Account, on_delete=models.CASCADE, null=True, blank=True, related_name="follow_ups")
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, null=True, blank=True, related_name="follow_ups")
    deal = models.ForeignKey(Deal, on_delete=models.CASCADE, null=True, blank=True, related_name="follow_ups")

    scheduled_at = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    remarks = models.TextField(blank=True)

    def __str__(self):
        target = self.lead or self.deal or self.account or self.contact or self.customer
        return f"FollowUp [{self.status}] - {target} @ {self.scheduled_at}"


# ─────────────────────────────────────────────
# TAG
# ─────────────────────────────────────────────
class Tag(models.Model):
    name = models.CharField(max_length=100, unique=True)
    color = models.CharField(max_length=20, default="#3B82F6")

    def __str__(self):
        return self.name


class LeadTag(models.Model):
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name="tags")
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("lead", "tag")


class CustomerTag(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="tags")
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("customer", "tag")