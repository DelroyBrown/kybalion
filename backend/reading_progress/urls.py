from rest_framework.routers import SimpleRouter

from .views import ReadingProgressViewSet, ReadingSessionViewSet

router = SimpleRouter()
router.register("sessions", ReadingSessionViewSet, basename="reading-session")
router.register("", ReadingProgressViewSet, basename="reading-progress")

urlpatterns = router.urls
