from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from .models import AnnotationType, Definition
from .serializers import AnnotationTypeSerializer, DefinitionSerializer


class AnnotationTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AnnotationType.objects.all()
    serializer_class = AnnotationTypeSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"
    pagination_class = None


class DefinitionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Definition.objects.all()
    serializer_class = DefinitionSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"
    search_fields = ["term", "meaning"]
