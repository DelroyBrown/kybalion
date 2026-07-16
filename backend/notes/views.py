from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from common.permissions import IsOwner

from .models import UserNote
from .serializers import UserNoteSerializer


class UserNoteViewSet(viewsets.ModelViewSet):
    serializer_class = UserNoteSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filterset_fields = ["kind", "object_id", "chapter_slug", "pinned", "linked_principle__slug"]
    search_fields = ["title", "body", "label"]
    ordering_fields = ["updated_at", "created_at", "pinned"]

    def get_queryset(self):
        return UserNote.objects.filter(user=self.request.user).select_related("linked_principle")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
