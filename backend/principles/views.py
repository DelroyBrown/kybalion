from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from library.models import Chapter, Passage

from .models import Principle, PrincipleRelationship, PrincipleReflectionPrompt
from .serializers import PrincipleDetailSerializer, PrincipleListSerializer, ReflectionPromptSerializer


class PrincipleViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    lookup_field = "slug"
    pagination_class = None

    def get_queryset(self):
        qs = Principle.objects.filter(is_published=True)
        if self.action == "retrieve":
            qs = qs.prefetch_related(
                "examples", "misunderstandings", "reflection_prompts", "visualisations",
                "relationships_out__to_principle", "relationships_in__from_principle",
            )
        return qs

    def get_serializer_class(self):
        return PrincipleDetailSerializer if self.action == "retrieve" else PrincipleListSerializer

    @action(detail=False, methods=["get"])
    def prompts(self, request):
        """All reflection prompts (used by the journal's guided-prompt picker)."""
        prompts = PrincipleReflectionPrompt.objects.select_related("principle")
        context = request.query_params.get("context")
        if context:
            prompts = prompts.filter(context=context)
        return Response(ReflectionPromptSerializer(prompts, many=True).data)

    @action(detail=False, methods=["get"])
    def graph(self, request):
        """Node/edge payload for the knowledge map."""
        nodes, edges = [], []

        principles = list(Principle.objects.filter(is_published=True))
        for p in principles:
            nodes.append({
                "id": f"principle:{p.slug}", "type": "principle", "slug": p.slug,
                "label": p.name, "number": p.number, "accent": p.accent, "symbol": p.symbol,
                "summary": p.summary,
            })

        for chapter in Chapter.objects.filter(is_published=True):
            nodes.append({
                "id": f"chapter:{chapter.slug}", "type": "chapter", "slug": chapter.slug,
                "label": f"{chapter.number}. {chapter.title}", "number": chapter.number,
            })

        passage_qs = Passage.objects.filter(is_published=True).select_related(
            "paragraph__section__chapter"
        ).prefetch_related("principles")
        for passage in passage_qs:
            chapter = passage.paragraph.section.chapter
            nodes.append({
                "id": f"passage:{passage.slug}", "type": "passage", "slug": passage.slug,
                "label": passage.excerpt[:80], "chapter": chapter.slug,
            })
            edges.append({
                "source": f"passage:{passage.slug}", "target": f"chapter:{chapter.slug}",
                "kind": "located-in",
            })
            for p in passage.principles.all():
                edges.append({
                    "source": f"passage:{passage.slug}", "target": f"principle:{p.slug}",
                    "kind": "expresses",
                })

        for rel in PrincipleRelationship.objects.select_related("from_principle", "to_principle"):
            edges.append({
                "source": f"principle:{rel.from_principle.slug}",
                "target": f"principle:{rel.to_principle.slug}",
                "kind": rel.kind,
                "description": rel.description,
            })

        return Response({"nodes": nodes, "edges": edges})
