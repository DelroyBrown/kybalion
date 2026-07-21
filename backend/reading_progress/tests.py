from django.test import TestCase

from common.test_utils import auth_client, create_book_tree, create_user


class ReadingProgressTests(TestCase):
    def setUp(self):
        self.tree = create_book_tree()
        self.user = create_user("owner")
        self.client = auth_client(self.user)

    def test_upsert_progress(self):
        first = self.client.post("/api/me/progress/", {
            "chapter": "chapter-one", "last_paragraph_order": 3,
            "furthest_paragraph_order": 3, "percent_complete": 30.0,
        }, format="json")
        self.assertEqual(first.status_code, 200)
        second = self.client.post("/api/me/progress/", {
            "chapter": "chapter-one", "last_paragraph_order": 1,
            "furthest_paragraph_order": 1, "percent_complete": 10.0,
        }, format="json")
        # Furthest position and percent never regress; last position may.
        self.assertEqual(second.data["furthest_paragraph_order"], 3)
        self.assertEqual(second.data["percent_complete"], 30.0)
        self.assertEqual(second.data["last_paragraph_order"], 1)
        self.assertEqual(len(self.client.get("/api/me/progress/").data), 1)

    def test_completion_sets_timestamp(self):
        response = self.client.post("/api/me/progress/", {
            "chapter": "chapter-one", "percent_complete": 100.0, "completed": True,
        }, format="json")
        self.assertTrue(response.data["completed"])
        self.assertIsNotNone(response.data["completed_at"])

    def test_merge_local_progress(self):
        response = self.client.post("/api/me/progress/merge/", {
            "entries": [
                {"chapter": "chapter-one", "furthest_paragraph_order": 5, "percent_complete": 50.0},
                {"chapter": "missing-chapter", "percent_complete": 10.0},
            ]
        }, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["merged"], 1)

    def test_summary(self):
        self.client.post("/api/me/progress/", {
            "chapter": "chapter-one", "percent_complete": 100.0, "completed": True,
        }, format="json")
        summary = self.client.get("/api/me/progress/summary/")
        self.assertEqual(summary.data["chapters_completed"], 1)
        self.assertEqual(summary.data["overall_percent"], 100.0)

    def test_sessions_recorded(self):
        response = self.client.post("/api/me/progress/sessions/", {
            "chapter": "chapter-one", "started_at": "2026-07-16T20:00:00Z", "duration_seconds": 600,
        }, format="json")
        self.assertEqual(response.status_code, 201)
        summary = self.client.get("/api/me/progress/summary/")
        self.assertEqual(summary.data["total_reading_seconds"], 600)

    def test_reset_clears_positions_but_keeps_sessions(self):
        self.client.post("/api/me/progress/", {
            "chapter": "chapter-one", "percent_complete": 60.0,
        }, format="json")
        self.client.post("/api/me/progress/sessions/", {
            "chapter": "chapter-one", "started_at": "2026-07-16T20:00:00Z", "duration_seconds": 600,
        }, format="json")

        response = self.client.post("/api/me/progress/reset/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(self.client.get("/api/me/progress/").data), 0)
        summary = self.client.get("/api/me/progress/summary/")
        self.assertEqual(summary.data["overall_percent"], 0.0)
        self.assertEqual(summary.data["total_reading_seconds"], 600)

    def test_reset_leaves_other_readers_alone(self):
        self.client.post("/api/me/progress/", {"chapter": "chapter-one", "percent_complete": 40.0}, format="json")
        other = auth_client(create_user("other"))
        other.post("/api/me/progress/", {"chapter": "chapter-one", "percent_complete": 70.0}, format="json")

        self.client.post("/api/me/progress/reset/")
        self.assertEqual(len(other.get("/api/me/progress/").data), 1)

    def test_ownership_isolated(self):
        self.client.post("/api/me/progress/", {"chapter": "chapter-one", "percent_complete": 40.0}, format="json")
        intruder = auth_client(create_user("intruder"))
        self.assertEqual(len(intruder.get("/api/me/progress/").data), 0)
