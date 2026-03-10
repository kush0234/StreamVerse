from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DashboardViewSet,
    VideoManagementViewSet,
    EpisodeManagementViewSet,
    MusicManagementViewSet,
    AnalyticsViewSet
)

router = DefaultRouter()
router.register(r'overview', DashboardViewSet, basename='dashboard')
router.register(r'videos', VideoManagementViewSet, basename='video-management')
router.register(r'episodes', EpisodeManagementViewSet, basename='episode-management')
router.register(r'music', MusicManagementViewSet, basename='music-management')
router.register(r'analytics', AnalyticsViewSet, basename='analytics')

urlpatterns = [
    path('', include(router.urls)),
]
