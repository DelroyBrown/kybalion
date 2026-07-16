from django.test import TestCase

from common.test_utils import auth_client, create_user


class UserNoteTests(TestCase):
    def setUp(self):
        self.user = create_user("owner")
        self.client = auth_client(self.user)

    def test_crud_flow(self):
        created = self.client.post("/api/me/notes/", {
            "kind": "passage", "object_id": "axiom-mentalism", "title": "First thought",
            "body": "The axiom reads like idealism.", "tags": ["mentalism"],
        }, format="json")
        self.assertEqual(created.status_code, 201)
        note_id = created.data["id"]
        self.assertEqual(created.data["character_count"], len("The axiom reads like idealism."))

        updated = self.client.patch(f"/api/me/notes/{note_id}/", {"pinned": True}, format="json")
        self.assertTrue(updated.data["pinned"])

        deleted = self.client.delete(f"/api/me/notes/{note_id}/")
        self.assertEqual(deleted.status_code, 204)
        self.assertEqual(self.client.get("/api/me/notes/").data["count"], 0)

    def test_filter_by_target(self):
        self.client.post("/api/me/notes/", {"kind": "passage", "object_id": "a", "body": "one"}, format="json")
        self.client.post("/api/me/notes/", {"kind": "chapter", "object_id": "b", "body": "two"}, format="json")
        response = self.client.get("/api/me/notes/?kind=passage&object_id=a")
        self.assertEqual(response.data["count"], 1)

    def test_ownership_isolated(self):
        created = self.client.post(
            "/api/me/notes/", {"kind": "passage", "object_id": "a", "body": "private"}, format="json"
        )
        intruder = auth_client(create_user("intruder"))
        self.assertEqual(intruder.get(f"/api/me/notes/{created.data['id']}/").status_code, 404)
        self.assertEqual(
            intruder.patch(f"/api/me/notes/{created.data['id']}/", {"body": "stolen"}, format="json").status_code,
            404,
        )
