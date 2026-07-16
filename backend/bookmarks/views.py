from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.permissions import IsOwner

from .models import Bookmark
from .serializers import BookmarkSerializer


class BookmarkViewSet(viewsets.ModelViewSet):
    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    filterset_fields = ["kind", "chapter_slug"]
    search_fields = ["title", "note", "label"]
    ordering_fields = ["created_at", "title"]

    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user)

    @action(detail=False, methods=["post"])
    def toggle(self, request):
        """Create the bookmark if absent, remove it if present."""
        kind = request.data.get("kind")
        object_id = str(request.data.get("object_id", ""))
        if not kind or not object_id:
            return Response(
                {"error": {"code": "invalid", "detail": "kind and object_id are required", "status": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        existing = self.get_queryset().filter(kind=kind, object_id=object_id).first()
        if existing:
            existing.delete()
            return Response({"bookmarked": False, "bookmark": None})
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response({"bookmarked": True, "bookmark": serializer.data}, status=status.HTTP_201_CREATED)
