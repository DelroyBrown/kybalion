from django.contrib import admin

from .models import (
    Principle,
    PrincipleExample,
    PrincipleMisunderstanding,
    PrincipleReflectionPrompt,
    PrincipleRelationship,
)


class ExampleInline(admin.TabularInline):
    model = PrincipleExample
    extra = 0


class MisunderstandingInline(admin.TabularInline):
    model = PrincipleMisunderstanding
    extra = 0


class ReflectionPromptInline(admin.TabularInline):
    model = PrincipleReflectionPrompt
    extra = 0


class RelationshipInline(admin.TabularInline):
    model = PrincipleRelationship
    fk_name = "from_principle"
    extra = 0


@admin.register(Principle)
class PrincipleAdmin(admin.ModelAdmin):
    list_display = ["number", "name", "slug", "is_published"]
    list_display_links = ["name"]
    list_editable = ["is_published"]
    prepopulated_fields = {"slug": ["name"]}
    inlines = [ExampleInline, MisunderstandingInline, ReflectionPromptInline, RelationshipInline]


@admin.register(PrincipleReflectionPrompt)
class ReflectionPromptAdmin(admin.ModelAdmin):
    list_display = ["prompt", "principle", "context", "order"]
    list_filter = ["context", "principle"]
