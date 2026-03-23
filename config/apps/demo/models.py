from django.db import models
from apps.common.models import AuditModel
from apps.inventory.models import Laptop
from apps.customers.models import Customer


class Demo(AuditModel):
    STATUS_CHOICES = (
        ("ONGOING",          "Ongoing"),
        ("RETURNED",         "Returned"),
        ("CONVERTED_RENTAL", "Converted to Rental"),
        ("CONVERTED_SALE",   "Converted to Sale"),
    )

    PURPOSE_CHOICES = (
        ("performance_testing",     "Performance Testing"),
        ("software_compatibility",  "Software Compatibility"),
        ("team_evaluation",         "Team Evaluation"),
        ("student_trial",           "Student Trial"),
        ("video_editing",           "Video Editing"),
        ("programming_development", "Programming / Development"),
        ("graphic_design",          "Graphic Design"),
        ("general_evaluation",      "General Evaluation"),
        ("other",                   "Other"),
    )

    customer = models.ForeignKey(
        Customer,
        on_delete=models.PROTECT,
        related_name="demos"
    )

    assigned_date        = models.DateField()
    expected_return_date = models.DateField()
    actual_return_date   = models.DateField(null=True, blank=True)
    duration_days        = models.PositiveIntegerField(default=7)

    status  = models.CharField(max_length=20, choices=STATUS_CHOICES, default="ONGOING")
    purpose = models.CharField(max_length=50, choices=PURPOSE_CHOICES, default="general_evaluation")

    specific_requirements = models.TextField(blank=True)
    requires_training     = models.BooleanField(default=False)
    delivery_required     = models.BooleanField(default=False)
    delivery_address      = models.TextField(blank=True)

    # Feedback
    feedback_received = models.BooleanField(default=False)
    feedback          = models.TextField(blank=True)
    feedback_rating   = models.PositiveSmallIntegerField(null=True, blank=True)  # 1-5

    # Conversion links
    converted_rental = models.OneToOneField(
        "rentals.Rental",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="from_demo"
    )
    converted_sale = models.OneToOneField(
        "sales.Sale",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="from_demo"
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Demo #{self.id} — {self.customer.name}"


class DemoItem(AuditModel):
    demo   = models.ForeignKey(Demo, on_delete=models.CASCADE, related_name="items")
    laptop = models.ForeignKey(Laptop, on_delete=models.PROTECT)

    class Meta:
        unique_together = ("demo", "laptop")

    def __str__(self):
        return f"{self.laptop.serial_number} in Demo #{self.demo.id}"
