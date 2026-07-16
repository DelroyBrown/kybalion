"""Shared fixtures for backend tests."""
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from library.models import Book, Chapter, Edition, Paragraph, Passage, Section

User = get_user_model()


def create_user(username="reader", password="starlit-archive-9", email=None):
    return User.objects.create_user(
        username=username, password=password, email=email or f"{username}@example.com"
    )


def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def create_book_tree():
    """A minimal book -> chapter -> section -> paragraph -> passage tree."""
    book = Book.objects.create(slug="test-book", title="Test Book")
    edition = Edition.objects.create(book=book, slug="test-edition", name="Test Edition", is_primary=True)
    chapter = Chapter.objects.create(
        book=book, edition=edition, slug="chapter-one", number=1, title="Chapter One", order=1
    )
    section = Section.objects.create(chapter=chapter, slug="section-one", title="Section One", order=1)
    paragraph = Paragraph.objects.create(
        section=section, order=1,
        text="Nothing rests; everything moves; everything vibrates.", kind=Paragraph.Kind.EPIGRAPH,
    )
    passage = Passage.objects.create(
        slug="test-passage", paragraph=paragraph, start_offset=0, end_offset=13, excerpt="Nothing rests",
    )
    return {
        "book": book, "edition": edition, "chapter": chapter,
        "section": section, "paragraph": paragraph, "passage": passage,
    }
