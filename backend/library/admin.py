from django.contrib import admin

from .models import Book, Chapter, Edition, Paragraph, Passage, Section, SourceReference


class EditionInline(admin.TabularInline):
    model = Edition
    extra = 0


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ["title", "author_attribution", "published_year", "is_public_domain"]
    prepopulated_fields = {"slug": ["title"]}
    inlines = [EditionInline]


class SourceReferenceInline(admin.TabularInline):
    model = SourceReference
    extra = 0


@admin.register(Edition)
class EditionAdmin(admin.ModelAdmin):
    list_display = ["name", "book", "publisher", "year", "is_primary"]
    inlines = [SourceReferenceInline]


class SectionInline(admin.TabularInline):
    model = Section
    extra = 0
    fields = ["order", "slug", "title"]


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ["number", "title", "book", "order", "is_published"]
    list_display_links = ["title"]
    list_editable = ["order", "is_published"]
    list_filter = ["book", "is_published"]
    search_fields = ["title", "subtitle"]
    prepopulated_fields = {"slug": ["title"]}
    inlines = [SectionInline]


class ParagraphInline(admin.TabularInline):
    model = Paragraph
    extra = 0
    fields = ["order", "kind", "is_placeholder", "text"]


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ["__str__", "chapter", "order"]
    list_filter = ["chapter"]
    inlines = [ParagraphInline]


class PassageInline(admin.TabularInline):
    model = Passage
    extra = 0
    fields = ["slug", "start_offset", "end_offset", "excerpt", "is_published"]


@admin.register(Paragraph)
class ParagraphAdmin(admin.ModelAdmin):
    list_display = ["__str__", "kind", "is_placeholder", "short_text"]
    list_filter = ["kind", "is_placeholder", "section__chapter"]
    search_fields = ["text"]
    inlines = [PassageInline]

    @admin.display(description="Text")
    def short_text(self, obj):
        return obj.text[:100]


@admin.register(Passage)
class PassageAdmin(admin.ModelAdmin):
    list_display = ["slug", "short_excerpt", "chapter", "is_published", "is_placeholder"]
    list_filter = ["is_published", "is_placeholder", "principles"]
    search_fields = ["slug", "excerpt"]
    filter_horizontal = ["principles"]
    actions = ["publish", "unpublish"]

    @admin.display(description="Excerpt")
    def short_excerpt(self, obj):
        return obj.excerpt[:80]

    @admin.display(description="Chapter")
    def chapter(self, obj):
        return obj.paragraph.section.chapter.title

    @admin.action(description="Publish selected passages")
    def publish(self, request, queryset):
        queryset.update(is_published=True)

    @admin.action(description="Unpublish selected passages")
    def unpublish(self, request, queryset):
        queryset.update(is_published=False)
