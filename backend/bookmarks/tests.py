from django.test import TestCase
from rest_framework.test import APIClient

from common.test_utils import auth_client, create_user


class BookmarkTests(TestCase):
    def setUp(self):
        self.user = create_user("owner")
        self.other = create_user("intruder")
        self.client = auth_client(self.user)
        self.payload = {
            "kind": "passage", "object_id": "axiom-mentalism",
            "chapter_slug": "the-seven-hermetic-principles", "title": "The first axiom",
        }

    def test_requires_authentication(self):
        self.assertEqual(APIClient().get("/api/me/bookmarks/").status_code, 401)

    def test_create_and_list(self):
        created = self.client.post("/api/me/bookmarks/", self.payload, format="json")
        self.assertEqual(created.status_code, 201)
        listed = self.client.get("/api/me/bookmarks/")
        self.assertEqual(listed.data["count"], 1)

    def test_duplicate_prevented(self):
        self.client.post("/api/me/bookmarks/", self.payload, format="json")
        duplicate = self.client.post("/api/me/bookmarks/", self.payload, format="json")
        self.assertEqual(duplicate.status_code, 400)

    def test_toggle_creates_then_removes(self):
        first = self.client.post("/api/me/bookmarks/toggle/", self.payload, format="json")
        self.assertEqual(first.status_code, 201)
        self.assertTrue(first.data["bookmarked"])
        second = self.client.post("/api/me/bookmarks/toggle/", self.payload, format="json")
        self.assertEqual(second.status_code, 200)
        self.assertFalse(second.data["bookmarked"])
        self.assertEqual(self.client.get("/api/me/bookmarks/").data["count"], 0)

    def test_ownership_isolated(self):
        created = self.client.post("/api/me/bookmarks/", self.payload, format="json")
        bookmark_id = created.data["id"]
        intruder = auth_client(self.other)
        self.assertEqual(intruder.get("/api/me/bookmarks/").data["count"], 0)
        self.assertEqual(intruder.get(f"/api/me/bookmarks/{bookmark_id}/").status_code, 404)
        self.assertEqual(intruder.delete(f"/api/me/bookmarks/{bookmark_id}/").status_code, 404)
        # Same target may be bookmarked by a different user.
        response = intruder.post("/api/me/bookmarks/", self.payload, format="json")
        self.assertEqual(response.status_code, 201)
