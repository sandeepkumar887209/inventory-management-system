from rest_framework.routers import DefaultRouter
from .views import LaptopViewSet, StockMovementViewSet, SupplierViewSet

router = DefaultRouter()
router.register(r"laptops",       LaptopViewSet,        basename="laptops")
router.register(r"stockmovement", StockMovementViewSet, basename="stockmovement")
router.register(r"suppliers",     SupplierViewSet,      basename="suppliers")

urlpatterns = router.urls