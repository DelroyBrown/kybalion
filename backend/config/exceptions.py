"""Consistent error envelope for API responses.

Every error response has the shape:
    {"error": {"code": <str>, "detail": <str|dict>, "status": <int>}}
"""
from rest_framework.views import exception_handler as drf_exception_handler


def exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is None:
        return None

    detail = response.data
    code = getattr(getattr(exc, "detail", None), "code", None) or exc.__class__.__name__.lower()
    response.data = {"error": {"code": code, "detail": detail, "status": response.status_code}}
    return response
