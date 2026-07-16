from rest_framework.routers import SimpleRouter

from .views import BookmarkViewSet

router = SimpleRouter()
router.register("", BookmarkViewSet, basename="bookmark")

urlpatterns = router.urls
