from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from django.contrib.auth.models import User
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.exceptions import AuthenticationFailed

from .models import UserProfile
from .serializers import RegisterSerializer, UserProfileSerializer, ApprovalActionSerializer, CreateUserSerializer, UpdateUserSerializer


# ─── Custom Login (checks approval) ───

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        # Check if user has a profile and is approved
        try:
            profile = self.user.profile
            if profile.approval_status == 'pending':
                raise AuthenticationFailed(
                    'Your account is pending admin approval.',
                    code='pending_approval',
                )
            if profile.approval_status == 'rejected':
                raise AuthenticationFailed(
                    'Your account request has been rejected.',
                    code='rejected',
                )
        except UserProfile.DoesNotExist:
            # Admin/superusers without profile can still log in
            pass

        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# ─── Public Registration ───

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'message': 'Registration successful. Your account is pending admin approval.'},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Admin: List All Users ───

class UserListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        # Ensure all users have a profile
        for user in User.objects.filter(profile__isnull=True):
            UserProfile.objects.create(
                user=user,
                approval_status='approved',
                role_title='Admin' if user.is_superuser else 'Staff',
            )

        profiles = UserProfile.objects.select_related('user').all()

        # Optional query filters
        approval = request.query_params.get('approval_status')
        if approval:
            profiles = profiles.filter(approval_status=approval)

        search = request.query_params.get('search')
        if search:
            profiles = profiles.filter(
                user__username__icontains=search
            ) | profiles.filter(
                user__email__icontains=search
            ) | profiles.filter(
                user__first_name__icontains=search
            ) | profiles.filter(
                user__last_name__icontains=search
            )

        serializer = UserProfileSerializer(profiles, many=True)
        return Response(serializer.data)


# ─── Admin: Approve User ───

class ApproveUserView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, user_id):
        try:
            profile = UserProfile.objects.get(user_id=user_id)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        action_serializer = ApprovalActionSerializer(data=request.data)
        action_serializer.is_valid(raise_exception=True)

        profile.approval_status = 'approved'
        profile.user.is_active = True

        # Optionally update role/department during approval
        if action_serializer.validated_data.get('role_title'):
            profile.role_title = action_serializer.validated_data['role_title']
        if action_serializer.validated_data.get('department'):
            profile.department = action_serializer.validated_data['department']

        profile.user.save()
        profile.save()

        return Response({'message': f'User {profile.user.username} approved.'})


# ─── Admin: Reject User ───

class RejectUserView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, user_id):
        try:
            profile = UserProfile.objects.get(user_id=user_id)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        profile.approval_status = 'rejected'
        profile.user.is_active = False
        profile.user.save()
        profile.save()

        return Response({'message': f'User {profile.user.username} rejected.'})


# ─── Admin: Create User ───

class CreateUserView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        serializer = CreateUserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            profile = UserProfile.objects.get(user=user)
            return Response(UserProfileSerializer(profile).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Admin: Update User ───

class UpdateUserView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, user_id):
        try:
            profile = UserProfile.objects.select_related('user').get(user_id=user_id)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = UpdateUserSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Re-fetch to get updated full serialized data
            profile.refresh_from_db()
            profile.user.refresh_from_db()
            return Response(UserProfileSerializer(profile).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Admin: Delete User ───

class DeleteUserView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if user.is_superuser:
            return Response({'error': 'Cannot delete superuser'}, status=status.HTTP_403_FORBIDDEN)

        username = user.username
        user.delete()
        return Response({'message': f'User {username} deleted.'})


# ─── User Profile (Self) ───

class ProfileView(APIView):
    """
    View to get or update the authenticated user's profile.
    """
    def get(self, request):
        try:
            profile = request.user.profile
        except UserProfile.DoesNotExist:
            # Fallback for admins who might not have a profile record yet
            profile = UserProfile.objects.create(
                user=request.user,
                approval_status='approved',
                role_title='Admin' if request.user.is_superuser else 'Staff'
            )
        
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

    def patch(self, request):
        try:
            profile = request.user.profile
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=request.user, approval_status='approved')
            
        serializer = UpdateUserSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserProfileSerializer(profile).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
