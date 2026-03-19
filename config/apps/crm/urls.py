from rest_framework.routers import DefaultRouter
from .views import LeadViewSet, ActivityViewSet, FollowUpViewSet, TagViewSet

router = DefaultRouter()
router.register(r"leads", LeadViewSet, basename="leads")
router.register(r"activities", ActivityViewSet, basename="activities")
router.register(r"followups", FollowUpViewSet, basename="followups")
router.register(r"tags", TagViewSet, basename="tags")

urlpatterns = router.urls