from django.contrib import admin

from .models import Highlight


@admin.register(Highlight)
class HighlightAdmin(admin.ModelAdmin):
    list_display = ["user", "paragraph", "style", "created_at"]
    list_filter = ["style"]
