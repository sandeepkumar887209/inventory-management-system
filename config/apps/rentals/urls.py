from rest_framework.routers import DefaultRouter
from .views import RentalViewSet, RentalItemViewSet


router = DefaultRouter()
router.register(r'rental',       RentalViewSet,     basename="rental")
router.register(r'rental-items', RentalItemViewSet, basename="rental-items")

urlpatterns = router.urls
