from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from common.test_utils import auth_client, create_user

User = get_user_model()

NO_THROTTLE = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticatedOrReadOnly"],
    "DEFAULT_THROTTLE_CLASSES": [],
    "EXCEPTION_HANDLER": "config.exceptions.exception_handler",
}


@override_settings(REST_FRAMEWORK=NO_THROTTLE)
class RegistrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_returns_tokens(self):
        response = self.client.post("/api/auth/register/", {
            "username": "hermes", "email": "hermes@example.com", "password": "emerald-tablet-77",
        })
        self.assertEqual(response.status_code, 201)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["username"], "hermes")

    def test_register_rejects_weak_password(self):
        response = self.client.post("/api/auth/register/", {
            "username": "hermes", "email": "hermes@example.com", "password": "short",
        })
        self.assertEqual(response.status_code, 400)

    def test_register_rejects_duplicate_email(self):
        create_user("first", email="same@example.com")
        response = self.client.post("/api/auth/register/", {
            "username": "second", "email": "same@example.com", "password": "emerald-tablet-77",
        })
        self.assertEqual(response.status_code, 400)


@override_settings(REST_FRAMEWORK=NO_THROTTLE)
class TokenFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = create_user("hermes", password="emerald-tablet-77")

    def test_obtain_and_refresh(self):
        response = self.client.post("/api/auth/token/", {"username": "hermes", "password": "emerald-tablet-77"})
        self.assertEqual(response.status_code, 200)
        refresh = response.data["refresh"]
        refreshed = self.client.post("/api/auth/token/refresh/", {"refresh": refresh})
        self.assertEqual(refreshed.status_code, 200)
        self.assertIn("access", refreshed.data)

    def test_logout_blacklists_refresh_token(self):
        tokens = self.client.post(
            "/api/auth/token/", {"username": "hermes", "password": "emerald-tablet-77"}
        ).data
        client = auth_client(self.user)
        response = client.post("/api/auth/logout/", {"refresh": tokens["refresh"]})
        self.assertEqual(response.status_code, 204)
        reused = self.client.post("/api/auth/token/refresh/", {"refresh": tokens["refresh"]})
        self.assertEqual(reused.status_code, 401)


@override_settings(REST_FRAMEWORK=NO_THROTTLE)
class ProfileTests(TestCase):
    def setUp(self):
        self.user = create_user()
        self.client = auth_client(self.user)

    def test_me_requires_auth(self):
        self.assertEqual(APIClient().get("/api/me/").status_code, 401)

    def test_get_and_update_profile(self):
        response = self.client.get("/api/me/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["username"], "reader")
        patched = self.client.patch("/api/me/", {"email": "new@example.com"})
        self.assertEqual(patched.status_code, 200)
        self.assertEqual(patched.data["email"], "new@example.com")

    def test_delete_account(self):
        response = self.client.delete("/api/me/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(User.objects.filter(username="reader").exists())

    def test_export_contains_all_sections(self):
        response = self.client.get("/api/me/export/")
        self.assertEqual(response.status_code, 200)
        for key in ["profile", "preferences", "bookmarks", "highlights", "notes", "journal", "reading_progress"]:
            self.assertIn(key, response.data)


@override_settings(REST_FRAMEWORK=NO_THROTTLE)
class PreferencesTests(TestCase):
    def setUp(self):
        self.user = create_user()
        self.client = auth_client(self.user)

    def test_defaults_returned(self):
        response = self.client.get("/api/me/preferences/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["settings"]["theme"], "midnight")

    def test_update_merges_settings(self):
        response = self.client.put("/api/me/preferences/", {"settings": {"theme": "parchment"}}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["settings"]["theme"], "parchment")
        self.assertEqual(response.data["settings"]["mode"], "guided")  # untouched default

    def test_rejects_unknown_keys(self):
        response = self.client.put("/api/me/preferences/", {"settings": {"evil": True}}, format="json")
        self.assertEqual(response.status_code, 400)
