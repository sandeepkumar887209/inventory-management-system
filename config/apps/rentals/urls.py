from rest_framework.routers import DefaultRouter
from .views import RentalViewSet


router = DefaultRouter()
router.register(r'rental', RentalViewSet, basename="rental")

urlpatterns = router.urls
