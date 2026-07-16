from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import DEFAULT_READER_SETTINGS, ReaderPreference

User = get_user_model()

ALLOWED_PREFERENCE_KEYS = set(DEFAULT_READER_SETTINGS)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    class Meta:
        model = User
        fields = ["username", "email", "password"]
        extra_kwargs = {"email": {"required": True}}

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
        )


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "date_joined"]
        read_only_fields = ["id", "username", "date_joined"]


class ReaderPreferenceSerializer(serializers.ModelSerializer):
    settings = serializers.JSONField()

    class Meta:
        model = ReaderPreference
        fields = ["settings", "updated_at"]

    def validate_settings(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Settings must be an object.")
        unknown = set(value) - ALLOWED_PREFERENCE_KEYS
        if unknown:
            raise serializers.ValidationError(f"Unknown preference keys: {sorted(unknown)}")
        return value
