from rest_framework import status, views
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import RecentSearch
from .services import search_private, search_public

PUBLIC_TYPES = {"passages", "chapters", "principles", "annotations", "definitions"}
PRIVATE_TYPES = {"notes", "journal", "highlights", "bookmarks"}


class SearchView(views.APIView):
    permission_classes = [AllowAny]
    throttle_scope = "search"

    def get(self, request):
        query = (request.query_params.get("q") or "").strip()
        if len(query) < 2:
            return Response(
                {"error": {"code": "query_too_short", "detail": "Provide at least 2 characters.", "status": 400}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        requested = {
            t.strip() for t in (request.query_params.get("types") or "").split(",") if t.strip()
        }
        exact = request.query_params.get("exact") == "true"
        chapter = request.query_params.get("chapter")
        principle = request.query_params.get("principle")

        results = search_public(query, chapter=chapter, principle=principle, exact=exact)
        if request.user.is_authenticated:
            results.update(search_private(query, request.user, exact=exact))
            self._record_recent(request.user, query)

        if requested:
            results = {key: value for key, value in results.items() if key in requested}

        total = sum(len(group) for group in results.values())
        return Response({"query": query, "total": total, "results": results})

    @staticmethod
    def _record_recent(user, query):
        RecentSearch.objects.filter(user=user, query__iexact=query).delete()
        RecentSearch.objects.create(user=user, query=query)
        # Keep only the ten most recent.
        stale_ids = RecentSearch.objects.filter(user=user).values_list("id", flat=True)[10:]
        if stale_ids:
            RecentSearch.objects.filter(id__in=list(stale_ids)).delete()


class RecentSearchView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        recent = RecentSearch.objects.filter(user=request.user)[:10]
        return Response([{"query": r.query, "created_at": r.created_at} for r in recent])

    def delete(self, request):
        RecentSearch.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
