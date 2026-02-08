from django.db import models
from apps.common.models import AuditModel

class Customer(AuditModel):
    TYPE = [
        ('individual', 'Individual'),
        ('company', 'Company'),
    ]

    name = models.CharField(max_length=255)
    customer_type = models.CharField(max_length=20, choices=TYPE)

    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True)

    identifiers = models.JSONField(
        default=dict,
        blank=True,
        help_text="GST, PAN, CIN, Aadhar"
    )

    extra_details = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return self.name
