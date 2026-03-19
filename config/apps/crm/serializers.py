from rest_framework import serializers
from .models import Lead, Activity, FollowUp, Tag, LeadTag, CustomerTag
from apps.customers.serializers import CustomerSerializer


# ─────────────────────────────────────────────
# TAG
# ─────────────────────────────────────────────
class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = "__all__"


# ─────────────────────────────────────────────
# ACTIVITY
# ─────────────────────────────────────────────
class ActivitySerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(
        source="created_by.get_full_name", read_only=True
    )

    class Meta:
        model = Activity
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "created_by", "updated_by")

    def validate(self, attrs):
        if not attrs.get("lead") and not attrs.get("customer"):
            raise serializers.ValidationError(
                "Activity must be linked to either a Lead or a Customer."
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
        if not attrs.get("lead") and not attrs.get("customer"):
            raise serializers.ValidationError(
                "FollowUp must be linked to either a Lead or a Customer."
            )
        return attrs


# ─────────────────────────────────────────────
# LEAD
# ─────────────────────────────────────────────
class LeadSerializer(serializers.ModelSerializer):
    activities = ActivitySerializer(many=True, read_only=True)
    follow_ups = FollowUpSerializer(many=True, read_only=True)
    converted_customer_detail = CustomerSerializer(
        source="converted_customer", read_only=True
    )
    tags = serializers.SerializerMethodField()

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


class LeadListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views (no nested activities)."""

    tags = serializers.SerializerMethodField()
    activity_count = serializers.SerializerMethodField()
    pending_followups = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = [
            "id", "name", "phone", "email", "company",
            "source", "intent", "status", "follow_up_date",
            "expected_laptops", "budget", "tags",
            "activity_count", "pending_followups",
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