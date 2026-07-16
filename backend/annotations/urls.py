from rest_framework.routers import DefaultRouter

from .views import AnnotationTypeViewSet, DefinitionViewSet

router = DefaultRouter()
router.register("annotation-types", AnnotationTypeViewSet, basename="annotation-type")
router.register("definitions", DefinitionViewSet, basename="definition")

urlpatterns = router.urls
