from django.contrib import admin

from .models import (
    Annotation,
    AnnotationSource,
    AnnotationType,
    Definition,
    PassageRelationship,
    VisualisationReference,
)


@admin.register(AnnotationType)
class AnnotationTypeAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "order"]
    list_editable = ["order"]
    prepopulated_fields = {"slug": ["name"]}


class AnnotationSourceInline(admin.TabularInline):
    model = AnnotationSource
    extra = 0


@admin.register(Annotation)
class AnnotationAdmin(admin.ModelAdmin):
    list_display = ["short_title", "annotation_type", "passage", "origin", "status", "ai_reviewed"]
    list_filter = ["annotation_type", "origin", "status", "ai_reviewed"]
    search_fields = ["title", "body", "passage__slug"]
    filter_horizontal = ["related_principles"]
    inlines = [AnnotationSourceInline]
    actions = ["publish", "unpublish", "mark_reviewed"]
    fieldsets = [
        (None, {"fields": ["passage", "annotation_type", "title", "body", "order", "status"]}),
        ("Attribution", {"fields": ["origin", "attribution", "version", "related_principles"]}),
        ("AI provenance", {
            "classes": ["collapse"],
            "fields": ["ai_model", "ai_prompt_kind", "ai_generated_at", "ai_reviewed"],
            "description": "Required whenever origin is AI-generated. AI content is always labelled in the product.",
        }),
    ]

    @admin.display(description="Annotation")
    def short_title(self, obj):
        return obj.title or obj.body[:60]

    @admin.action(description="Publish selected annotations")
    def publish(self, request, queryset):
        queryset.update(status=Annotation.Status.PUBLISHED)

    @admin.action(description="Unpublish (set to draft)")
    def unpublish(self, request, queryset):
        queryset.update(status=Annotation.Status.DRAFT)

    @admin.action(description="Mark AI output as reviewed")
    def mark_reviewed(self, request, queryset):
        queryset.update(ai_reviewed=True)


@admin.register(Definition)
class DefinitionAdmin(admin.ModelAdmin):
    list_display = ["term", "slug"]
    search_fields = ["term", "meaning"]
    prepopulated_fields = {"slug": ["term"]}
    filter_horizontal = ["passages"]


@admin.register(PassageRelationship)
class PassageRelationshipAdmin(admin.ModelAdmin):
    list_display = ["from_passage", "kind", "to_passage"]
    list_filter = ["kind"]


@admin.register(VisualisationReference)
class VisualisationReferenceAdmin(admin.ModelAdmin):
    list_display = ["title", "component_key", "principle", "passage"]
    prepopulated_fields = {"slug": ["title"]}
