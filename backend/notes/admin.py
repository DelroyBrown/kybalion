from django.contrib import admin

from .models import UserNote


@admin.register(UserNote)
class UserNoteAdmin(admin.ModelAdmin):
    list_display = ["user", "kind", "object_id", "title", "pinned", "updated_at"]
    list_filter = ["kind", "pinned"]
