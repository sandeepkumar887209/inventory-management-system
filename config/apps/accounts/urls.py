from django.urls import path
from .views import (
    RegisterView,
    UserListView,
    CreateUserView,
    ApproveUserView,
    RejectUserView,
    UpdateUserView,
    DeleteUserView,
    ProfileView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/create/', CreateUserView.as_view(), name='user-create'),
    path('users/<int:user_id>/approve/', ApproveUserView.as_view(), name='user-approve'),
    path('users/<int:user_id>/reject/', RejectUserView.as_view(), name='user-reject'),
    path('users/<int:user_id>/update/', UpdateUserView.as_view(), name='user-update'),
    path('users/<int:user_id>/delete/', DeleteUserView.as_view(), name='user-delete'),
]
