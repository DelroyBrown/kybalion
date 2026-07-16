from django.test import TestCase

from common.test_utils import auth_client, create_book_tree, create_user


class JournalTests(TestCase):
    def setUp(self):
        self.tree = create_book_tree()
        self.user = create_user("owner")
        self.client = auth_client(self.user)

    def test_create_free_entry(self):
        response = self.client.post("/api/me/journal/", {
            "kind": "free", "title": "Evening pages", "body": "Testing the pendulum idea against my week.",
        }, format="json")
        self.assertEqual(response.status_code, 201)

    def test_create_passage_reflection_links_passage(self):
        response = self.client.post("/api/me/journal/", {
            "kind": "passage", "body": "On stillness.", "passage": "test-passage",
        }, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["passage"], "test-passage")
        self.assertEqual(response.data["passage_excerpt"], "Nothing rests")

    def test_draft_autosave_roundtrip(self):
        created = self.client.post("/api/me/journal/", {"kind": "free", "is_draft": True, "body": "dra"}, format="json")
        entry_id = created.data["id"]
        saved = self.client.patch(f"/api/me/journal/{entry_id}/", {"body": "draft grown", "is_draft": False}, format="json")
        self.assertEqual(saved.data["body"], "draft grown")
        self.assertFalse(saved.data["is_draft"])

    def test_filter_and_favourite(self):
        self.client.post("/api/me/journal/", {"kind": "free", "body": "a", "favourite": True}, format="json")
        self.client.post("/api/me/journal/", {"kind": "daily", "body": "b"}, format="json")
        response = self.client.get("/api/me/journal/?favourite=true")
        self.assertEqual(response.data["count"], 1)

    def test_export_endpoint(self):
        self.client.post("/api/me/journal/", {"kind": "free", "body": "exported"}, format="json")
        response = self.client.get("/api/me/journal/export/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["exported_count"], 1)

    def test_ownership_isolated(self):
        created = self.client.post("/api/me/journal/", {"kind": "free", "body": "mine"}, format="json")
        intruder = auth_client(create_user("intruder"))
        self.assertEqual(intruder.get(f"/api/me/journal/{created.data['id']}/").status_code, 404)
        self.assertEqual(intruder.get("/api/me/journal/").data["count"], 0)
