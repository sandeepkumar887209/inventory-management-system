from rest_framework.routers import DefaultRouter
from .views import DemoViewSet, DemoItemViewSet

router = DefaultRouter()
router.register(r"demo", DemoViewSet, basename="demo")
router.register(r"demo-items", DemoItemViewSet, basename="demo-items")

urlpatterns = router.urls
