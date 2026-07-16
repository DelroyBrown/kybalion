from django.test import TestCase
from rest_framework.test import APIClient

from principles.models import Principle, PrincipleRelationship


class PrincipleApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.mentalism = Principle.objects.create(
            slug="mentalism", number=1, name="The Principle of Mentalism", summary="Mind first."
        )
        self.vibration = Principle.objects.create(
            slug="vibration", number=3, name="The Principle of Vibration", summary="Everything moves."
        )
        PrincipleRelationship.objects.create(
            from_principle=self.vibration, to_principle=self.mentalism, kind="builds_on"
        )

    def test_list_is_public_and_ordered(self):
        response = self.client.get("/api/principles/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([p["number"] for p in response.data], [1, 3])

    def test_detail_includes_relationships(self):
        response = self.client.get("/api/principles/vibration/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["relationships"][0]["principle"]["slug"], "mentalism")

    def test_unpublished_hidden(self):
        Principle.objects.filter(slug="vibration").update(is_published=False)
        self.assertEqual(self.client.get("/api/principles/vibration/").status_code, 404)

    def test_graph_returns_nodes_and_edges(self):
        response = self.client.get("/api/principles/graph/")
        self.assertEqual(response.status_code, 200)
        node_ids = {node["id"] for node in response.data["nodes"]}
        self.assertIn("principle:mentalism", node_ids)
        edge_kinds = {edge["kind"] for edge in response.data["edges"]}
        self.assertIn("builds_on", edge_kinds)
