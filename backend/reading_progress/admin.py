from django.contrib import admin

from .models import ReadingProgress, ReadingSession


@admin.register(ReadingProgress)
class ReadingProgressAdmin(admin.ModelAdmin):
    list_display = ["user", "chapter", "percent_complete", "completed", "updated_at"]
    list_filter = ["completed", "chapter"]


@admin.register(ReadingSession)
class ReadingSessionAdmin(admin.ModelAdmin):
    list_display = ["user", "chapter", "started_at", "duration_seconds"]
