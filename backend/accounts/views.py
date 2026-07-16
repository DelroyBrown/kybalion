from django.contrib.auth import get_user_model
from rest_framework import generics, status, views
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import ReaderPreference
from .serializers import ProfileSerializer, ReaderPreferenceSerializer, RegisterSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_scope = "auth-burst"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": ProfileSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class ThrottledTokenObtainPairView(TokenObtainPairView):
    throttle_scope = "auth-burst"


class ThrottledTokenRefreshView(TokenRefreshView):
    throttle_scope = "auth-burst"


class LogoutView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            RefreshToken(request.data.get("refresh", "")).blacklist()
        except TokenError:
            return Response(
                {"error": {"code": "invalid_token", "detail": "Invalid refresh token.", "status": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(generics.RetrieveUpdateDestroyAPIView):
    """GET profile, PATCH profile fields, DELETE the whole account."""

    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class PreferencesView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pref, _ = ReaderPreference.objects.get_or_create(user=request.user)
        return Response({"settings": pref.merged_settings(), "updated_at": pref.updated_at})

    def put(self, request):
        pref, _ = ReaderPreference.objects.get_or_create(user=request.user)
        serializer = ReaderPreferenceSerializer(pref, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        pref.settings = {**(pref.settings or {}), **serializer.validated_data.get("settings", {})}
        pref.save()
        return Response({"settings": pref.merged_settings(), "updated_at": pref.updated_at})


class ExportView(views.APIView):
    """Everything the user owns, as one JSON document."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from bookmarks.serializers import BookmarkSerializer
        from highlights.serializers import HighlightSerializer
        from journal.serializers import JournalEntrySerializer
        from notes.serializers import UserNoteSerializer
        from reading_progress.serializers import ReadingProgressSerializer

        user = request.user
        pref = getattr(user, "reader_preference", None)
        payload = {
            "profile": ProfileSerializer(user).data,
            "preferences": pref.merged_settings() if pref else {},
            "bookmarks": BookmarkSerializer(user.bookmarks.all(), many=True).data,
            "highlights": HighlightSerializer(user.highlights.all(), many=True).data,
            "notes": UserNoteSerializer(user.notes.all(), many=True).data,
            "journal": JournalEntrySerializer(user.journal_entries.all(), many=True).data,
            "reading_progress": ReadingProgressSerializer(user.reading_progress.all(), many=True).data,
        }
        response = Response(payload)
        response["Content-Disposition"] = 'attachment; filename="kybalion-export.json"'
        return response
