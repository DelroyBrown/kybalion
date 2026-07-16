from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from common.permissions import IsOwner

from .models import Highlight
from .serializers import HighlightSerializer


class HighlightViewSet(viewsets.ModelViewSet):
    serializer_class = HighlightSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filterset_fields = {
        "style": ["exact"],
        "paragraph": ["exact"],
        "paragraph__section__chapter__slug": ["exact"],
    }
    search_fields = ["text", "note"]
    ordering_fields = ["created_at"]

    def get_queryset(self):
        return Highlight.objects.filter(user=self.request.user).select_related(
            "paragraph__section__chapter"
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
