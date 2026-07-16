from django.urls import path

from .views import RecentSearchView, SearchView

urlpatterns = [
    path("", SearchView.as_view(), name="search"),
    path("recent/", RecentSearchView.as_view(), name="search-recent"),
]
