from django.contrib import admin

from .models import Bookmark


@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ["user", "kind", "object_id", "title", "created_at"]
    list_filter = ["kind"]
