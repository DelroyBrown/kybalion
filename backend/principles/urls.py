from rest_framework.routers import DefaultRouter

from .views import PrincipleViewSet

router = DefaultRouter()
router.register("principles", PrincipleViewSet, basename="principle")

urlpatterns = router.urls
