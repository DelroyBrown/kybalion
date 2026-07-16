from rest_framework.routers import DefaultRouter

from .views import BookViewSet, ChapterViewSet, PassageViewSet

router = DefaultRouter()
router.register("books", BookViewSet, basename="book")
router.register("chapters", ChapterViewSet, basename="chapter")
router.register("passages", PassageViewSet, basename="passage")

urlpatterns = router.urls
