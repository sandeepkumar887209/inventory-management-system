from rest_framework.routers import DefaultRouter
from .views import LaptopViewSet,StockMovementViewSet

router = DefaultRouter()
router.register(r'laptops', LaptopViewSet, basename='laptops'),
router.register(r'stockmovement', StockMovementViewSet, basename='stockmovement')

urlpatterns = router.urls
