from rest_framework.routers import DefaultRouter
from .views import RentalViewSet
from .views import RentalReturnViewSet, RentalReplacementViewSet

router = DefaultRouter()
router.register(r'rental', RentalViewSet, basename="rental")
router.register(r'return', RentalReturnViewSet,basename="return")
router.register(r'replacement', RentalReplacementViewSet,basename="replacement")

urlpatterns = router.urls
