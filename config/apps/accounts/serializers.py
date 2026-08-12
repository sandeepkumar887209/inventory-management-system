from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile


class RegisterSerializer(serializers.Serializer):
    """Public registration — creates User + UserProfile (pending)."""
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    full_name = serializers.CharField(max_length=200)
    company = serializers.CharField(max_length=200, required=False, default='')
    role = serializers.CharField(max_length=100, required=False, default='Staff')

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value

    def create(self, validated_data):
        name_parts = validated_data['full_name'].split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=first_name,
            last_name=last_name,
            is_active=False,  # blocked until admin approves
        )

        UserProfile.objects.create(
            user=user,
            company=validated_data.get('company', ''),
            role_title=validated_data.get('role', 'Staff'),
            approval_status='pending',
        )

        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Read-only serializer for admin user list."""
    id = serializers.IntegerField(source='user.id')
    username = serializers.CharField(source='user.username')
    email = serializers.EmailField(source='user.email')
    full_name = serializers.SerializerMethodField()
    is_active = serializers.BooleanField(source='user.is_active')
    last_login = serializers.DateTimeField(source='user.last_login')
    date_joined = serializers.DateTimeField(source='user.date_joined')

    is_staff = serializers.BooleanField(source='user.is_staff')
    is_superuser = serializers.BooleanField(source='user.is_superuser')

    class Meta:
        model = UserProfile
        fields = [
            'id', 'username', 'email', 'full_name', 'is_active',
            'company', 'phone', 'department', 'role_title',
            'approval_status', 'last_login', 'date_joined', 'created_at',
            'is_staff', 'is_superuser',
        ]

    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username


class ApprovalActionSerializer(serializers.Serializer):
    """For approve/reject + optional role assignment."""
    role_title = serializers.CharField(max_length=100, required=False, allow_null=True, allow_blank=True)
    department = serializers.CharField(max_length=100, required=False, allow_null=True, allow_blank=True)


class CreateUserSerializer(serializers.Serializer):
    """Admin creates a new user directly (auto-approved, active)."""
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    full_name = serializers.CharField(max_length=200)
    phone = serializers.CharField(max_length=20, required=False, default='')
    role_title = serializers.CharField(max_length=100, required=False, default='Staff')
    department = serializers.CharField(max_length=100, required=False, default='')
    company = serializers.CharField(max_length=200, required=False, default='')
    is_active = serializers.BooleanField(required=False, default=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value

    def create(self, validated_data):
        name_parts = validated_data['full_name'].split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=first_name,
            last_name=last_name,
            is_active=validated_data.get('is_active', True),
        )

        UserProfile.objects.create(
            user=user,
            company=validated_data.get('company', ''),
            phone=validated_data.get('phone', ''),
            role_title=validated_data.get('role_title', 'Staff'),
            department=validated_data.get('department', ''),
            approval_status='approved',
        )

        return user


class UpdateUserSerializer(serializers.Serializer):
    """Admin updates an existing user profile."""
    full_name = serializers.CharField(max_length=200, required=False)
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    role_title = serializers.CharField(max_length=100, required=False)
    department = serializers.CharField(max_length=100, required=False, allow_blank=True)
    company = serializers.CharField(max_length=200, required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False)

    def update(self, instance, validated_data):
        user = instance.user

        if 'full_name' in validated_data:
            name_parts = validated_data['full_name'].split(' ', 1)
            user.first_name = name_parts[0]
            user.last_name = name_parts[1] if len(name_parts) > 1 else ''

        if 'email' in validated_data:
            user.email = validated_data['email']

        if 'is_active' in validated_data:
            user.is_active = validated_data['is_active']

        user.save()

        if 'phone' in validated_data:
            instance.phone = validated_data['phone']
        if 'role_title' in validated_data:
            instance.role_title = validated_data['role_title']
        if 'department' in validated_data:
            instance.department = validated_data['department']
        if 'company' in validated_data:
            instance.company = validated_data['company']

        instance.save()
        return instance
