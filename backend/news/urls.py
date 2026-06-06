from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    PublicFeedView, PublicStoryDetailView, CategoryListView,
    NewsStoryViewSet, DeadlineListCreateView, NewsReportsView,
)

router = DefaultRouter()
router.register(r'stories', NewsStoryViewSet, basename='story')

urlpatterns = [
    path('feed/', PublicFeedView.as_view(), name='public-feed'),
    path('feed/<slug:slug>/', PublicStoryDetailView.as_view(), name='public-story'),
    path('categories/', CategoryListView.as_view(), name='categories'),
    path('deadlines/', DeadlineListCreateView.as_view(), name='deadlines'),
    path('reports/', NewsReportsView.as_view(), name='reports'),
    path('', include(router.urls)),
]
