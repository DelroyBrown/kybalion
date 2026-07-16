from django.contrib import admin
from django.urls import include, path

from accounts.views import ExportView, MeView, PreferencesView

urlpatterns = [
    path("admin/", admin.site.urls),
    # Public content
    path("api/", include("library.urls")),
    path("api/", include("principles.urls")),
    path("api/", include("annotations.urls")),
    path("api/search/", include("search.urls")),
    # Authentication
    path("api/auth/", include("accounts.urls")),
    # Private, per-user resources
    path("api/me/", MeView.as_view(), name="me"),
    path("api/me/export/", ExportView.as_view(), name="me-export"),
    path("api/me/preferences/", PreferencesView.as_view(), name="me-preferences"),
    path("api/me/progress/", include("reading_progress.urls")),
    path("api/me/bookmarks/", include("bookmarks.urls")),
    path("api/me/highlights/", include("highlights.urls")),
    path("api/me/notes/", include("notes.urls")),
    path("api/me/journal/", include("journal.urls")),
]

admin.site.site_header = "Kybalion Experience — Content Administration"
admin.site.site_title = "Kybalion Admin"
admin.site.index_title = "Manage the archive"
