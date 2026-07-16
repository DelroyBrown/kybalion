from django.contrib import admin

from .models import ReaderPreference


@admin.register(ReaderPreference)
class ReaderPreferenceAdmin(admin.ModelAdmin):
    list_display = ["user", "updated_at"]
