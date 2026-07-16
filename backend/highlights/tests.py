from django.test import TestCase

from common.test_utils import auth_client, create_book_tree, create_user


class HighlightTests(TestCase):
    def setUp(self):
        self.tree = create_book_tree()
        self.user = create_user("owner")
        self.client = auth_client(self.user)

    def test_create_snapshots_text_from_paragraph(self):
        response = self.client.post("/api/me/highlights/", {
            "paragraph": self.tree["paragraph"].id, "start_offset": 0, "end_offset": 13, "style": "gold",
        }, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["text"], "Nothing rests")
        self.assertEqual(response.data["chapter"]["slug"], "chapter-one")

    def test_rejects_inverted_offsets(self):
        response = self.client.post("/api/me/highlights/", {
            "paragraph": self.tree["paragraph"].id, "start_offset": 10, "end_offset": 4,
        }, format="json")
        self.assertEqual(response.status_code, 400)

    def test_rejects_offsets_beyond_text(self):
        response = self.client.post("/api/me/highlights/", {
            "paragraph": self.tree["paragraph"].id, "start_offset": 0, "end_offset": 9999,
        }, format="json")
        self.assertEqual(response.status_code, 400)

    def test_filter_by_chapter(self):
        self.client.post("/api/me/highlights/", {
            "paragraph": self.tree["paragraph"].id, "start_offset": 0, "end_offset": 13,
        }, format="json")
        response = self.client.get(
            "/api/me/highlights/?paragraph__section__chapter__slug=chapter-one"
        )
        self.assertEqual(response.data["count"], 1)
        empty = self.client.get("/api/me/highlights/?paragraph__section__chapter__slug=missing")
        self.assertEqual(empty.data["count"], 0)

    def test_ownership_isolated(self):
        created = self.client.post("/api/me/highlights/", {
            "paragraph": self.tree["paragraph"].id, "start_offset": 0, "end_offset": 13,
        }, format="json")
        intruder = auth_client(create_user("intruder"))
        self.assertEqual(intruder.get(f"/api/me/highlights/{created.data['id']}/").status_code, 404)
