from rest_framework.routers import SimpleRouter

from .views import UserNoteViewSet

router = SimpleRouter()
router.register("", UserNoteViewSet, basename="note")

urlpatterns = router.urls
