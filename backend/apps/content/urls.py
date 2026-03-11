from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VideoContentListView,
    VideoContentDetailView,
    MusicListView,
    MusicDetailView,
    EpisodeListView,
    SaveVideoProgressView,
    ContinueWatchingView,
    TrendingVideosView,
    TrendingMusicView,
    RecentlyWatchedView,
    WatchlistView,
    GenreListView,
    ComingSoonView,
    VideosByTagView,
    SimilarContentView,
    ArtistListView,
    ArtistDetailView,
    AlbumListView,
    AlbumDetailView,
)
from .tag_views import TagViewSet

# Router for ViewSets
router = DefaultRouter()
router.register(r'tags', TagViewSet, basename='tag')

urlpatterns = [
    # Video content (movies and series)
    path("videos/trending/", TrendingVideosView.as_view(), name="trending-videos"),
    path("videos/coming-soon/", ComingSoonView.as_view(), name="coming-soon"),
    path("videos/by-tag/<slug:tag_slug>/", VideosByTagView.as_view(), name="videos-by-tag"),
    path("videos/<int:pk>/similar/", SimilarContentView.as_view(), name="similar-content"),
    path("videos/", VideoContentListView.as_view(), name="video-list"),
    path("videos/<int:pk>/", VideoContentDetailView.as_view(), name="video-detail"),
    path("watch-progress/", SaveVideoProgressView.as_view()),
    path("continue-watching/", ContinueWatchingView.as_view()),
    path("recently-watched/", RecentlyWatchedView.as_view()),
    # Music
    path("music/trending/", TrendingMusicView.as_view(), name="trending-music"),
    path("music/", MusicListView.as_view(), name="music-list"),
    path("music/<int:pk>/", MusicDetailView.as_view(), name="music-detail"),
    # Artists
    path("artists/", ArtistListView.as_view(), name="artist-list"),
    path("artists/<str:artist_name>/", ArtistDetailView.as_view(), name="artist-detail"),
    # Albums
    path("albums/", AlbumListView.as_view(), name="album-list"),
    path("albums/<str:artist_name>/<str:album_title>/", AlbumDetailView.as_view(), name="album-detail"),
    # Episodes for a specific series
    path(
        "videos/<int:series_id>/episodes/",
        EpisodeListView.as_view(),
        name="episode-list",
    ),
    # Watchlist
    path("watchlist/", WatchlistView.as_view(), name="watchlist"),
    # Genres
    path("genres/", GenreListView.as_view(), name="genres"),
    # Router URLs (tags only)
    path("", include(router.urls)),
]
# Import recommendation views
from .recommendation_views import (
    home_recommendations,
    trending_videos as rec_trending_videos,
    trending_music as rec_trending_music,
    top_video_picks,
    top_music_picks,
    continue_watching as rec_continue_watching,
    similar_content,
    record_interaction,
    update_similarity_scores,
)

# Add recommendation URLs to urlpatterns
recommendation_urls = [
    # Main recommendation endpoints
    path("recommendations/home/", home_recommendations, name="home-recommendations"),
    path("recommendations/videos/trending/", rec_trending_videos, name="rec-trending-videos"),
    path("recommendations/music/trending/", rec_trending_music, name="rec-trending-music"),
    path("recommendations/videos/top-picks/", top_video_picks, name="top-video-picks"),
    path("recommendations/music/top-picks/", top_music_picks, name="top-music-picks"),
    path("recommendations/continue-watching/", rec_continue_watching, name="rec-continue-watching"),
    path("recommendations/similar/<int:content_id>/", similar_content, name="similar-content-rec"),
    
    # Interaction tracking
    path("recommendations/record-interaction/", record_interaction, name="record-interaction"),
    
    # Admin endpoints
    path("recommendations/update-similarity/", update_similarity_scores, name="update-similarity"),
]

# Extend the main urlpatterns
urlpatterns.extend(recommendation_urls)