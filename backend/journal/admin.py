from django.contrib import admin

from .models import JournalEntry


@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ["user", "kind", "title", "favourite", "is_draft", "updated_at"]
    list_filter = ["kind", "favourite", "is_draft"]
