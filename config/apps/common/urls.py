from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viewsets import CompanySettingsViewSet

router = DefaultRouter()
router.register('company-settings', CompanySettingsViewSet, basename='company-settings')

urlpatterns = [
    path('', include(router.urls)),
]
