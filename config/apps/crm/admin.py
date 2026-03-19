from django.contrib import admin
from .models import Lead, Activity, FollowUp, Tag, LeadTag, CustomerTag


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "email", "source", "intent", "status", "follow_up_date", "created_at")
    list_filter = ("status", "source", "intent")
    search_fields = ("name", "phone", "email", "company")
    ordering = ("-created_at",)


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ("activity_type", "summary", "lead", "customer", "activity_date", "created_by")
    list_filter = ("activity_type",)
    search_fields = ("summary", "description")


@admin.register(FollowUp)
class FollowUpAdmin(admin.ModelAdmin):
    list_display = ("lead", "customer", "scheduled_at", "status")
    list_filter = ("status",)


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ("name", "color")


admin.site.register(LeadTag)
admin.site.register(CustomerTag)