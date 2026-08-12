from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Lead, Activity, FollowUp, Tag, LeadTag, CustomerTag, LeadStatusHistory,
    Account, Contact, Deal, Quote, QuoteLineItem
)
from apps.customers.serializers import CustomerSerializer


# ─────────────────────────────────────────────
# TAG
# ─────────────────────────────────────────────
class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = "__all__"


# ─────────────────────────────────────────────
# STATUS HISTORY
# ─────────────────────────────────────────────
class LeadStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = LeadStatusHistory
        fields = ["id", "from_status", "to_status", "changed_by_name", "note", "changed_at"]

    def get_changed_by_name(self, obj):
        if obj.changed_by:
            return obj.changed_by.get_full_name() or obj.changed_by.username
        return "System"


# ─────────────────────────────────────────────
# ACTIVITY
# ─────────────────────────────────────────────
class ActivitySerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "created_by", "updated_by")

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return ""

    def validate(self, attrs):
        if not any([attrs.get("lead"), attrs.get("customer"), attrs.get("account"), attrs.get("contact"), attrs.get("deal")]):
            raise serializers.ValidationError(
                "Activity must be linked to a Lead, Customer, Account, Contact, or Deal."
            )
        return attrs


# ─────────────────────────────────────────────
# FOLLOW-UP
# ─────────────────────────────────────────────
class FollowUpSerializer(serializers.ModelSerializer):
    class Meta:
        model = FollowUp
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "created_by", "updated_by")

    def validate(self, attrs):
        if not any([attrs.get("lead"), attrs.get("customer"), attrs.get("account"), attrs.get("contact"), attrs.get("deal")]):
            raise serializers.ValidationError(
                "FollowUp must be linked to a Lead, Customer, Account, Contact, or Deal."
            )
        return attrs


# ─────────────────────────────────────────────
# ZOHO MODULES (Account, Contact, Deal, Quote)
# ─────────────────────────────────────────────
class AccountSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Account
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "created_by", "updated_by")

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return None

class ContactSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()
    account_name = serializers.CharField(source="account.name", read_only=True)
    
    class Meta:
        model = Contact
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "created_by", "updated_by")

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return None

class DealSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()
    account_name = serializers.CharField(source="account.name", read_only=True)
    contact_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Deal
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "created_by", "updated_by")

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return None
        
    def get_contact_name(self, obj):
        if obj.contact:
            return f"{obj.contact.first_name} {obj.contact.last_name}".strip()
        return None

class QuoteLineItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteLineItem
        fields = "__all__"

class QuoteSerializer(serializers.ModelSerializer):
    line_items = QuoteLineItemSerializer(many=True, read_only=True)
    deal_name = serializers.CharField(source="deal.name", read_only=True)
    
    class Meta:
        model = Quote
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "created_by", "updated_by")

# ─────────────────────────────────────────────
# LEAD (detail)
# ─────────────────────────────────────────────
class LeadSerializer(serializers.ModelSerializer):
    activities = ActivitySerializer(many=True, read_only=True)
    follow_ups = FollowUpSerializer(many=True, read_only=True)
    status_history = LeadStatusHistorySerializer(many=True, read_only=True)
    converted_customer_detail = CustomerSerializer(
        source="converted_customer", read_only=True
    )
    tags = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = "__all__"
        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "converted_customer",
        )

    def get_tags(self, obj):
        return TagSerializer(
            [lt.tag for lt in obj.tags.select_related("tag").all()], many=True
        ).data

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return None


# ─────────────────────────────────────────────
# LEAD (list — lightweight)
# ─────────────────────────────────────────────
class LeadListSerializer(serializers.ModelSerializer):
    tags = serializers.SerializerMethodField()
    activity_count = serializers.SerializerMethodField()
    pending_followups = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = [
            "id", "name", "phone", "email", "company",
            "source", "intent", "status", "follow_up_date",
            "expected_laptops", "budget", "tags",
            "activity_count", "pending_followups",
            "assigned_to", "assigned_to_name",
            "created_at",
        ]

    def get_tags(self, obj):
        return TagSerializer(
            [lt.tag for lt in obj.tags.select_related("tag").all()], many=True
        ).data

    def get_activity_count(self, obj):
        return obj.activities.count()

    def get_pending_followups(self, obj):
        return obj.follow_ups.filter(status="PENDING").count()

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return None