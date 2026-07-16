from rest_framework.routers import SimpleRouter

from .views import HighlightViewSet

router = SimpleRouter()
router.register("", HighlightViewSet, basename="highlight")

urlpatterns = router.urls
