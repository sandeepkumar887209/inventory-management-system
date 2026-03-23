from rest_framework import serializers
from .models import Customer


# ─────────────────────────────────────────────
#  Lightweight — used in dropdowns / list views
# ─────────────────────────────────────────────

class CustomerMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Customer
        fields = ("id", "name", "customer_type", "phone", "email")


# ─────────────────────────────────────────────
#  List — table rows (no heavy fields)
# ─────────────────────────────────────────────

class CustomerListSerializer(serializers.ModelSerializer):

    full_address = serializers.CharField(read_only=True)

    class Meta:
        model  = Customer
        fields = (
            "id",
            "name",
            "customer_type",
            "phone",
            "alternate_phone",
            "email",
            "city",
            "state",
            "full_address",
            "is_active",
            "created_at",
        )


# ─────────────────────────────────────────────
#  Detail — full profile page
# ─────────────────────────────────────────────

class CustomerDetailSerializer(serializers.ModelSerializer):

    full_address = serializers.CharField(read_only=True)
    display_name = serializers.CharField(read_only=True)
    is_company   = serializers.BooleanField(read_only=True)

    class Meta:
        model  = Customer
        fields = (
            # Core
            "id",
            "name",
            "display_name",
            "customer_type",
            "is_company",
            "is_active",

            # Contact
            "phone",
            "alternate_phone",
            "email",
            "address",
            "city",
            "state",
            "pincode",
            "full_address",

            # Company info
            "company_name",
            "contact_person",
            "contact_person_phone",
            "contact_person_email",
            "designation",
            "trade_name",
            "industry",
            "employee_count",
            "website",

            # Company tax / legal
            "gst_number",
            "pan_number",
            "cin_number",
            "tan_number",
            "udyam_number",

            # Individual
            "aadhar_number",
            "pan_number_individual",

            # Business
            "credit_limit",
            "credit_period_days",

            # Internal
            "notes",
            "extra_details",

            # Audit
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        )
        read_only_fields = (
            "id",
            "display_name",
            "full_address",
            "is_company",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        )


# ─────────────────────────────────────────────
#  Create / Update — with validation
# ─────────────────────────────────────────────

class CustomerWriteSerializer(serializers.ModelSerializer):

    class Meta:
        model  = Customer
        fields = (
            "name",
            "customer_type",

            # Contact
            "phone",
            "alternate_phone",
            "email",
            "address",
            "city",
            "state",
            "pincode",

            # Company
            "company_name",
            "contact_person",
            "contact_person_phone",
            "contact_person_email",
            "designation",
            "trade_name",
            "industry",
            "employee_count",
            "website",

            # Company tax / legal
            "gst_number",
            "pan_number",
            "cin_number",
            "tan_number",
            "udyam_number",

            # Individual
            "aadhar_number",
            "pan_number_individual",

            # Business
            "credit_limit",
            "credit_period_days",

            # Internal
            "notes",
            "extra_details",
        )

    # ── Field-level validation ──────────────────────────────────────────────

    def validate_phone(self, value):
        digits = value.replace(" ", "").replace("-", "").replace("+", "")
        if not digits.isdigit():
            raise serializers.ValidationError("Phone must contain only digits, spaces, +, or -.")
        if len(digits) < 10:
            raise serializers.ValidationError("Phone number must be at least 10 digits.")
        return value

    def validate_gst_number(self, value):
        if not value:
            return value
        cleaned = value.strip().upper()
        if len(cleaned) != 15:
            raise serializers.ValidationError("GSTIN must be exactly 15 characters.")
        return cleaned

    def validate_pan_number(self, value):
        if not value:
            return value
        cleaned = value.strip().upper()
        if len(cleaned) != 10:
            raise serializers.ValidationError("PAN must be exactly 10 characters.")
        return cleaned

    def validate_pan_number_individual(self, value):
        if not value:
            return value
        cleaned = value.strip().upper()
        if len(cleaned) != 10:
            raise serializers.ValidationError("PAN must be exactly 10 characters.")
        return cleaned

    def validate_cin_number(self, value):
        if not value:
            return value
        cleaned = value.strip().upper()
        if len(cleaned) != 21:
            raise serializers.ValidationError("CIN must be exactly 21 characters.")
        return cleaned

    def validate_aadhar_number(self, value):
        if not value:
            return value
        digits = value.replace(" ", "")
        if not digits.isdigit() or len(digits) != 12:
            raise serializers.ValidationError("Aadhaar must be exactly 12 digits.")
        return digits

    def validate_pincode(self, value):
        if not value:
            return value
        if not value.isdigit() or len(value) != 6:
            raise serializers.ValidationError("PIN code must be exactly 6 digits.")
        return value

    # ── Object-level validation ─────────────────────────────────────────────

    def validate(self, attrs):
        customer_type = attrs.get(
            "customer_type",
            getattr(self.instance, "customer_type", None),
        )

        if customer_type == "company":
            if not attrs.get("company_name") and not attrs.get("name"):
                raise serializers.ValidationError(
                    {"company_name": "Company name is required for corporate customers."}
                )
            if not attrs.get("gst_number") and not self.partial:
                # Warn but don't block — GST is strongly recommended but not always available
                pass

        if customer_type == "individual":
            # Company-only fields should not be provided for individuals
            company_only = ["cin_number", "tan_number", "udyam_number", "gst_number"]
            for field in company_only:
                if attrs.get(field):
                    raise serializers.ValidationError(
                        {field: f"{field} is only applicable for company customers."}
                    )

        return attrs

    def to_representation(self, instance):
        """Return detailed representation after write operations."""
        return CustomerDetailSerializer(instance, context=self.context).data


# ─────────────────────────────────────────────
#  Default — keep as fallback / admin use
# ─────────────────────────────────────────────

CustomerSerializer = CustomerDetailSerializer