from rest_framework.routers import DefaultRouter
from .views import LaptopViewSet

router = DefaultRouter()
router.register(r'laptops', LaptopViewSet, basename='laptops')

urlpatterns = router.urls
