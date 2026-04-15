from rest_framework.routers import DefaultRouter
from .views import SaleViewSet, SaleItemViewSet

router = DefaultRouter()
router.register(r"sale", SaleViewSet, basename="sales")
router.register(r"sale-items", SaleItemViewSet, basename="sale-items")

urlpatterns = router.urls