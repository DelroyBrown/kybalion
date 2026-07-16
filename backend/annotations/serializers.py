from rest_framework import serializers

from .models import Annotation, AnnotationSource, AnnotationType, Definition, VisualisationReference


class AnnotationTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnnotationType
        fields = ["slug", "name", "description", "icon", "accent", "order"]


class AnnotationSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnnotationSource
        fields = ["citation", "url"]


class AnnotationSerializer(serializers.ModelSerializer):
    annotation_type = AnnotationTypeSerializer(read_only=True)
    sources = AnnotationSourceSerializer(many=True, read_only=True)
    related_principles = serializers.SlugRelatedField(many=True, read_only=True, slug_field="slug")
    ai_meta = serializers.SerializerMethodField()

    class Meta:
        model = Annotation
        fields = [
            "id", "annotation_type", "title", "body", "origin", "attribution",
            "version", "order", "sources", "related_principles", "ai_meta", "updated_at",
        ]

    def get_ai_meta(self, obj):
        if obj.origin != Annotation.Origin.AI:
            return None
        return {
            "model": obj.ai_model,
            "prompt_kind": obj.ai_prompt_kind,
            "generated_at": obj.ai_generated_at,
            "reviewed": obj.ai_reviewed,
        }


class DefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Definition
        fields = ["slug", "term", "meaning", "etymology"]


class VisualisationReferenceSerializer(serializers.ModelSerializer):
    principle = serializers.SlugRelatedField(read_only=True, slug_field="slug")

    class Meta:
        model = VisualisationReference
        fields = ["slug", "title", "description", "component_key", "principle"]
