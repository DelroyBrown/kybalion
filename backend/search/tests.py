from django.test import TestCase
from rest_framework.test import APIClient

from common.test_utils import auth_client, create_book_tree, create_user


class SearchTests(TestCase):
    def setUp(self):
        self.tree = create_book_tree()
        self.client = APIClient()

    def test_query_too_short_rejected(self):
        response = self.client.get("/api/search/?q=a")
        self.assertEqual(response.status_code, 400)

    def test_anonymous_search_finds_text(self):
        response = self.client.get("/api/search/?q=vibrates")
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data["results"]["passages"]), 1)
        self.assertNotIn("notes", response.data["results"])

    def test_type_filter(self):
        response = self.client.get("/api/search/?q=vibrates&types=chapters")
        self.assertEqual(list(response.data["results"].keys()), ["chapters"])

    def test_authenticated_search_includes_private_content(self):
        user = create_user()
        client = auth_client(user)
        client.post("/api/me/notes/", {
            "kind": "passage", "object_id": "test-passage", "body": "vibrates in my own words",
        }, format="json")
        response = client.get("/api/search/?q=vibrates")
        self.assertEqual(len(response.data["results"]["notes"]), 1)

    def test_recent_searches_recorded_and_cleared(self):
        user = create_user()
        client = auth_client(user)
        client.get("/api/search/?q=vibrates")
        client.get("/api/search/?q=pendulum")
        recent = client.get("/api/search/recent/")
        self.assertEqual([r["query"] for r in recent.data], ["pendulum", "vibrates"])
        cleared = client.delete("/api/search/recent/")
        self.assertEqual(cleared.status_code, 204)
        self.assertEqual(len(client.get("/api/search/recent/").data), 0)

    def test_private_search_not_leaked_between_users(self):
        owner = create_user("owner")
        auth_client(owner).post("/api/me/notes/", {
            "kind": "passage", "object_id": "x", "body": "secret vibrates",
        }, format="json")
        other = auth_client(create_user("other"))
        response = other.get("/api/search/?q=vibrates")
        self.assertEqual(len(response.data["results"]["notes"]), 0)
