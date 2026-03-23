from django.contrib import admin
from .models import Demo, DemoItem


class DemoItemInline(admin.TabularInline):
    model  = DemoItem
    extra  = 0
    fields = ("laptop",)
    readonly_fields = ("laptop",)


@admin.register(Demo)
class DemoAdmin(admin.ModelAdmin):
    list_display  = (
        "id", "customer", "status", "purpose",
        "assigned_date", "expected_return_date",
        "feedback_received", "created_at",
    )
    list_filter   = ("status", "purpose", "feedback_received", "requires_training", "delivery_required")
    search_fields = ("customer__name", "customer__phone", "purpose")
    ordering      = ("-created_at",)
    inlines       = [DemoItemInline]
    readonly_fields = ("created_at", "updated_at", "created_by", "updated_by",
                       "converted_rental", "converted_sale")

    fieldsets = (
        ("Core", {
            "fields": ("customer", "status", "purpose"),
        }),
        ("Dates", {
            "fields": ("assigned_date", "expected_return_date", "actual_return_date", "duration_days"),
        }),
        ("Details", {
            "fields": ("specific_requirements", "requires_training", "delivery_required", "delivery_address"),
        }),
        ("Feedback", {
            "fields": ("feedback_received", "feedback", "feedback_rating"),
        }),
        ("Conversion", {
            "fields": ("converted_rental", "converted_sale"),
            "classes": ("collapse",),
        }),
        ("Audit", {
            "fields": ("created_at", "updated_at", "created_by", "updated_by"),
            "classes": ("collapse",),
        }),
    )


@admin.register(DemoItem)
class DemoItemAdmin(admin.ModelAdmin):
    list_display = ("id", "demo", "laptop")
    search_fields = ("demo__customer__name", "laptop__serial_number")
