from rest_framework.routers import SimpleRouter

from .views import JournalEntryViewSet

router = SimpleRouter()
router.register("", JournalEntryViewSet, basename="journal-entry")

urlpatterns = router.urls
