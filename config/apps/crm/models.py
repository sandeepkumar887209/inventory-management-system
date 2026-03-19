from django.db import models
from apps.common.models import AuditModel
from apps.customers.models import Customer


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
        ("NEGOTIATION", "Negotiation"),
        ("CONVERTED", "Converted"),
        ("LOST", "Lost"),
    ]

    INTENT_CHOICES = [
        ("RENT", "Rent"),
        ("BUY", "Buy"),
        ("BOTH", "Both"),
    ]

    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    company = models.CharField(max_length=255, blank=True)
    address = models.TextField(blank=True)

    source = models.CharField(max_length=30, choices=SOURCE_CHOICES, default="OTHER")
    intent = models.CharField(max_length=10, choices=INTENT_CHOICES, default="RENT")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="NEW")

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

    # Activity can be linked to either a Lead or a Customer
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

    activity_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    summary = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    activity_date = models.DateTimeField()

    def __str__(self):
        target = self.lead or self.customer
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

    scheduled_at = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    remarks = models.TextField(blank=True)

    def __str__(self):
        target = self.lead or self.customer
        return f"FollowUp [{self.status}] - {target} @ {self.scheduled_at}"


# ─────────────────────────────────────────────
# TAG (reusable labels like VIP, Hot Lead etc.)
# ─────────────────────────────────────────────
class Tag(models.Model):
    name = models.CharField(max_length=100, unique=True)
    color = models.CharField(max_length=20, default="#3B82F6")  # Tailwind blue

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