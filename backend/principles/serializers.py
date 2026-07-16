from rest_framework import serializers

from annotations.serializers import VisualisationReferenceSerializer
from library.serializers import PassageLocationSerializer

from .models import (
    Principle,
    PrincipleExample,
    PrincipleMisunderstanding,
    PrincipleReflectionPrompt,
)


class PrincipleListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Principle
        fields = ["slug", "number", "name", "aphorism", "summary", "accent", "symbol", "visualisation_key"]


class PrincipleExampleSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrincipleExample
        fields = ["kind", "title", "body", "order"]


class PrincipleMisunderstandingSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrincipleMisunderstanding
        fields = ["claim", "clarification", "order"]


class ReflectionPromptSerializer(serializers.ModelSerializer):
    principle = serializers.SlugRelatedField(read_only=True, slug_field="slug")

    class Meta:
        model = PrincipleReflectionPrompt
        fields = ["id", "prompt", "context", "order", "principle"]


class PrincipleDetailSerializer(serializers.ModelSerializer):
    examples = PrincipleExampleSerializer(many=True, read_only=True)
    misunderstandings = PrincipleMisunderstandingSerializer(many=True, read_only=True)
    reflection_prompts = ReflectionPromptSerializer(many=True, read_only=True)
    relationships = serializers.SerializerMethodField()
    passages = serializers.SerializerMethodField()
    visualisations = VisualisationReferenceSerializer(many=True, read_only=True)

    class Meta:
        model = Principle
        fields = [
            "slug", "number", "name", "aphorism", "aphorism_source", "summary",
            "plain_explanation", "deep_interpretation", "editorial_note",
            "accent", "symbol", "visualisation_key",
            "examples", "misunderstandings", "reflection_prompts",
            "relationships", "passages", "visualisations",
        ]

    def get_relationships(self, obj):
        related = []
        for rel in obj.relationships_out.select_related("to_principle"):
            related.append({
                "kind": rel.kind, "description": rel.description, "direction": "out",
                "principle": PrincipleListSerializer(rel.to_principle).data,
            })
        for rel in obj.relationships_in.select_related("from_principle"):
            related.append({
                "kind": rel.kind, "description": rel.description, "direction": "in",
                "principle": PrincipleListSerializer(rel.from_principle).data,
            })
        return related

    def get_passages(self, obj):
        passages = obj.passages.filter(is_published=True).select_related("paragraph__section__chapter")
        return PassageLocationSerializer(passages, many=True).data
