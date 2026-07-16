from django.test import TestCase
from rest_framework.test import APIClient

from annotations.models import Annotation, AnnotationType
from common.test_utils import create_book_tree
from library.models import Chapter


class LibraryApiTests(TestCase):
    def setUp(self):
        self.tree = create_book_tree()
        self.client = APIClient()

    def test_anonymous_can_read_book(self):
        response = self.client.get("/api/books/test-book/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["title"], "Test Book")
        self.assertEqual(len(response.data["chapters"]), 1)

    def test_chapter_detail_includes_text_tree(self):
        response = self.client.get("/api/chapters/chapter-one/")
        self.assertEqual(response.status_code, 200)
        section = response.data["sections"][0]
        paragraph = section["paragraphs"][0]
        self.assertIn("Nothing rests", paragraph["text"])
        self.assertEqual(paragraph["passages"][0]["slug"], "test-passage")
        self.assertEqual(paragraph["passages"][0]["start_offset"], 0)

    def test_unpublished_chapter_hidden(self):
        Chapter.objects.filter(slug="chapter-one").update(is_published=False)
        self.assertEqual(self.client.get("/api/chapters/chapter-one/").status_code, 404)
        listing = self.client.get("/api/chapters/")
        self.assertEqual(len(listing.data), 0)

    def test_passage_detail_includes_published_annotations_only(self):
        annotation_type = AnnotationType.objects.create(slug="plain", name="Plain English")
        Annotation.objects.create(
            passage=self.tree["passage"], annotation_type=annotation_type,
            body="Visible.", status=Annotation.Status.PUBLISHED,
        )
        Annotation.objects.create(
            passage=self.tree["passage"], annotation_type=annotation_type,
            body="Hidden draft.", status=Annotation.Status.DRAFT,
        )
        response = self.client.get("/api/passages/test-passage/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["annotations"]), 1)
        self.assertEqual(response.data["annotations"][0]["body"], "Visible.")

    def test_passage_annotations_endpoint(self):
        annotation_type = AnnotationType.objects.create(slug="deep", name="Deep")
        Annotation.objects.create(
            passage=self.tree["passage"], annotation_type=annotation_type, body="An interpretation.",
        )
        response = self.client.get("/api/passages/test-passage/annotations/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_ai_annotations_carry_provenance(self):
        annotation_type = AnnotationType.objects.create(slug="ai", name="AI Interpretation")
        Annotation.objects.create(
            passage=self.tree["passage"], annotation_type=annotation_type,
            body="Machine reading.", origin=Annotation.Origin.AI, ai_model="local-mock",
        )
        response = self.client.get("/api/passages/test-passage/annotations/")
        self.assertEqual(response.data[0]["origin"], "ai")
        self.assertEqual(response.data[0]["ai_meta"]["model"], "local-mock")
