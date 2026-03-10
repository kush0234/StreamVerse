from rest_framework import generics, status
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count, Q
from .models import VideoContent, Episode, Music, VideoWatchHistory, Watchlist
from .serializers import (
    VideoContentSerializer,
    EpisodeSerializer,
    MusicSerializer,
    VideoWatchHistorySerializer,
    WatchlistSerializer,
)


class SaveVideoProgressView(generics.CreateAPIView):
    serializer_class = VideoWatchHistorySerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        profile_id = request.data.get("profile")

        # Ensure profile belongs to logged user
        if not request.user.profiles.filter(id=profile_id).exists():
            return Response({"error": "Invalid profile"}, status=403)

        video = request.data.get("video")
        episode = request.data.get("episode")

        history, created = VideoWatchHistory.objects.update_or_create(
            profile_id=profile_id,
            video_id=video,
            episode_id=episode,
            defaults={
                "user": request.user,
                "duration_watched": request.data.get("duration_watched", 0),
                "completed": request.data.get("completed", False),
            },
        )

        serializer = self.get_serializer(history)
        return Response(serializer.data)


class ContinueWatchingView(generics.ListAPIView):
    serializer_class = VideoWatchHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        profile_id = self.request.query_params.get("profile")

        if not profile_id:
            return VideoWatchHistory.objects.none()

        try:
            profile_id = int(profile_id)
        except ValueError:
            return VideoWatchHistory.objects.none()

        # Ensure profile belongs to user
        if not self.request.user.profiles.filter(id=profile_id).exists():
            return VideoWatchHistory.objects.none()

        return VideoWatchHistory.objects.filter(
            profile_id=profile_id, completed=False
        ).order_by("-updated_at")


class VideoContentListView(generics.ListAPIView):
    queryset = VideoContent.objects.all()
    serializer_class = VideoContentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["title", "description", "genre"]
    ordering_fields = ["release_date", "rating", "title", "view_count"]

    def get_queryset(self):
        queryset = super().get_queryset()
        content_type = self.request.query_params.get("type", None)
        genre = self.request.query_params.get("genre", None)

        if content_type:
            queryset = queryset.filter(content_type=content_type.upper())
        if genre:
            queryset = queryset.filter(genre__icontains=genre)

        return queryset


class VideoContentDetailView(generics.RetrieveAPIView):
    queryset = VideoContent.objects.prefetch_related("episodes")
    serializer_class = VideoContentSerializer
    permission_classes = [IsAuthenticated]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Increment view count
        instance.view_count += 1
        instance.save(update_fields=["view_count"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class TrendingVideosView(generics.ListAPIView):
    serializer_class = VideoContentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return VideoContent.objects.order_by("-view_count")[:10]


class RecentlyWatchedView(generics.ListAPIView):
    serializer_class = VideoWatchHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        profile_id = self.request.query_params.get("profile")
        if not profile_id:
            return VideoWatchHistory.objects.none()

        try:
            profile_id = int(profile_id)
        except ValueError:
            return VideoWatchHistory.objects.none()

        if not self.request.user.profiles.filter(id=profile_id).exists():
            return VideoWatchHistory.objects.none()

        return VideoWatchHistory.objects.filter(profile_id=profile_id).order_by(
            "-updated_at"
        )[:20]


class MusicListView(generics.ListAPIView):
    queryset = Music.objects.all()
    serializer_class = MusicSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["title", "artist", "album", "genre"]
    ordering_fields = ["release_date", "title", "artist", "play_count"]

    def get_queryset(self):
        queryset = super().get_queryset()
        genre = self.request.query_params.get("genre", None)

        if genre:
            queryset = queryset.filter(genre__icontains=genre)

        return queryset


class MusicDetailView(generics.RetrieveAPIView):
    queryset = Music.objects.all()
    serializer_class = MusicSerializer
    permission_classes = [IsAuthenticated]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Increment play count
        instance.play_count += 1
        instance.save(update_fields=["play_count"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class TrendingMusicView(generics.ListAPIView):
    serializer_class = MusicSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Music.objects.order_by("-play_count")[:10]


class EpisodeListView(generics.ListAPIView):
    serializer_class = EpisodeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        series_id = self.kwargs.get("series_id")
        return Episode.objects.filter(series_id=series_id).order_by(
            "season_number", "episode_number"
        )


class ArtistListView(APIView):
    """List all artists aggregated from Music model"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Count, Sum
        from .serializers import ArtistSerializer
        
        # Aggregate artists from Music model
        artists_data = Music.objects.values('artist').annotate(
            track_count=Count('id'),
            total_plays=Sum('play_count')
        ).order_by('artist')
        
        # Get genres for each artist
        artists = []
        for artist_data in artists_data:
            artist_name = artist_data['artist']
            
            # Get unique genres for this artist
            genres = list(Music.objects.filter(artist=artist_name).values_list('genre', flat=True).distinct())
            
            # Get thumbnail from the most recent track
            recent_track = Music.objects.filter(artist=artist_name).order_by('-created_at').first()
            thumbnail = recent_track.thumbnail.url if recent_track and recent_track.thumbnail else None
            
            artists.append({
                'name': artist_name,
                'track_count': artist_data['track_count'],
                'total_plays': artist_data['total_plays'] or 0,
                'genres': genres,
                'thumbnail': thumbnail
            })
        
        serializer = ArtistSerializer(artists, many=True)
        return Response(serializer.data)


class ArtistDetailView(APIView):
    """Get artist details and their music"""
    permission_classes = [IsAuthenticated]

    def get(self, request, artist_name):
        from django.db.models import Count, Sum
        from .serializers import ArtistSerializer, MusicSerializer
        
        # Get artist info
        artist_tracks = Music.objects.filter(artist=artist_name)
        if not artist_tracks.exists():
            return Response({'error': 'Artist not found'}, status=404)
        
        # Aggregate artist data
        artist_data = artist_tracks.aggregate(
            track_count=Count('id'),
            total_plays=Sum('play_count')
        )
        
        # Get genres and thumbnail
        genres = list(artist_tracks.values_list('genre', flat=True).distinct())
        recent_track = artist_tracks.order_by('-created_at').first()
        thumbnail = recent_track.thumbnail.url if recent_track and recent_track.thumbnail else None
        
        artist_info = {
            'name': artist_name,
            'track_count': artist_data['track_count'],
            'total_plays': artist_data['total_plays'] or 0,
            'genres': genres,
            'thumbnail': thumbnail
        }
        
        # Get all tracks by this artist
        tracks = artist_tracks.order_by('-created_at')
        
        artist_serializer = ArtistSerializer(artist_info)
        tracks_serializer = MusicSerializer(tracks, many=True, context={'request': request})
        
        return Response({
            'artist': artist_serializer.data,
            'tracks': tracks_serializer.data
        })


class AlbumListView(APIView):
    """List all albums aggregated from Music model"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Count, Sum, Min
        from .serializers import AlbumSerializer
        
        # Aggregate albums from Music model (exclude null albums)
        albums_data = Music.objects.exclude(album__isnull=True).exclude(album='').values('album', 'artist').annotate(
            track_count=Count('id'),
            total_duration=Sum('duration'),
            release_date=Min('release_date')
        ).order_by('-release_date')
        
        albums = []
        for album_data in albums_data:
            album_title = album_data['album']
            artist_name = album_data['artist']
            
            # Get thumbnail from the first track in album
            first_track = Music.objects.filter(album=album_title, artist=artist_name).first()
            thumbnail = first_track.thumbnail.url if first_track and first_track.thumbnail else None
            
            # Format duration
            total_seconds = album_data['total_duration'] or 0
            minutes = total_seconds // 60
            seconds = total_seconds % 60
            duration_formatted = f"{minutes}:{seconds:02d}"
            
            albums.append({
                'title': album_title,
                'artist': artist_name,
                'track_count': album_data['track_count'],
                'total_duration': total_seconds,
                'total_duration_formatted': duration_formatted,
                'release_date': album_data['release_date'],
                'thumbnail': thumbnail
            })
        
        serializer = AlbumSerializer(albums, many=True)
        return Response(serializer.data)


class AlbumDetailView(APIView):
    """Get album details and its tracks"""
    permission_classes = [IsAuthenticated]

    def get(self, request, artist_name, album_title):
        from django.db.models import Count, Sum, Min
        from .serializers import AlbumSerializer, MusicSerializer
        
        # Get album tracks
        album_tracks = Music.objects.filter(artist=artist_name, album=album_title)
        if not album_tracks.exists():
            return Response({'error': 'Album not found'}, status=404)
        
        # Aggregate album data
        album_data = album_tracks.aggregate(
            track_count=Count('id'),
            total_duration=Sum('duration'),
            release_date=Min('release_date')
        )
        
        # Get thumbnail
        first_track = album_tracks.first()
        thumbnail = first_track.thumbnail.url if first_track and first_track.thumbnail else None
        
        # Format duration
        total_seconds = album_data['total_duration'] or 0
        minutes = total_seconds // 60
        seconds = total_seconds % 60
        duration_formatted = f"{minutes}:{seconds:02d}"
        
        album_info = {
            'title': album_title,
            'artist': artist_name,
            'track_count': album_data['track_count'],
            'total_duration': total_seconds,
            'total_duration_formatted': duration_formatted,
            'release_date': album_data['release_date'],
            'thumbnail': thumbnail
        }
        
        # Get all tracks in this album
        tracks = album_tracks.order_by('created_at')
        
        album_serializer = AlbumSerializer(album_info)
        tracks_serializer = MusicSerializer(tracks, many=True, context={'request': request})
        
        return Response({
            'album': album_serializer.data,
            'tracks': tracks_serializer.data
        })



class WatchlistView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile_id = request.query_params.get("profile")
        if not profile_id:
            return Response({"error": "Profile ID required"}, status=400)

        if not request.user.profiles.filter(id=profile_id).exists():
            return Response({"error": "Invalid profile"}, status=403)

        watchlist = Watchlist.objects.filter(profile_id=profile_id).order_by(
            "-added_at"
        )
        serializer = WatchlistSerializer(watchlist, many=True)
        return Response(serializer.data)

    def post(self, request):
        profile_id = request.data.get("profile")
        video_id = request.data.get("video")
        music_id = request.data.get("music")

        if not profile_id:
            return Response({"error": "Profile ID required"}, status=400)

        if not request.user.profiles.filter(id=profile_id).exists():
            return Response({"error": "Invalid profile"}, status=403)

        if not video_id and not music_id:
            return Response({"error": "Video or Music ID required"}, status=400)

        watchlist, created = Watchlist.objects.get_or_create(
            user=request.user,
            profile_id=profile_id,
            video_id=video_id,
            music_id=music_id,
        )

        serializer = WatchlistSerializer(watchlist)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request):
        profile_id = request.query_params.get("profile")
        video_id = request.query_params.get("video")
        music_id = request.query_params.get("music")

        if not profile_id:
            return Response({"error": "Profile ID required"}, status=400)

        if not request.user.profiles.filter(id=profile_id).exists():
            return Response({"error": "Invalid profile"}, status=403)

        query = Q(user=request.user, profile_id=profile_id)
        if video_id:
            query &= Q(video_id=video_id)
        if music_id:
            query &= Q(music_id=music_id)

        deleted_count, _ = Watchlist.objects.filter(query).delete()

        if deleted_count > 0:
            return Response(
                {"message": "Removed from watchlist"}, status=status.HTTP_204_NO_CONTENT
            )
        return Response({"error": "Item not found in watchlist"}, status=404)


class GenreListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        content_type = request.query_params.get("type", "video")

        if content_type == "music":
            genres = Music.objects.values_list("genre", flat=True).distinct()
        else:
            genres = VideoContent.objects.values_list("genre", flat=True).distinct()

        return Response({"genres": list(genres)})


class ComingSoonView(generics.ListAPIView):
    """Get all coming soon content"""
    serializer_class = VideoContentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return VideoContent.objects.filter(
            is_coming_soon=True,
            approval_status='APPROVED'
        ).order_by('expected_release_date', '-created_at')


class VideosByTagView(generics.ListAPIView):
    """Get videos filtered by tag"""
    serializer_class = VideoContentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        tag_slug = self.kwargs.get('tag_slug')
        return VideoContent.objects.filter(
            tags__slug=tag_slug,
            approval_status='APPROVED'
        ).distinct().order_by('-created_at')


class SimilarContentView(generics.ListAPIView):
    """Get similar content based on tags and genre"""
    serializer_class = VideoContentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        video_id = self.kwargs.get('pk')
        
        try:
            current_video = VideoContent.objects.get(id=video_id)
        except VideoContent.DoesNotExist:
            return VideoContent.objects.none()
        
        # Get videos with shared tags
        similar_videos = VideoContent.objects.filter(
            tags__in=current_video.tags.all(),
            approval_status='APPROVED'
        ).exclude(
            id=current_video.id
        ).annotate(
            shared_tags=Count('tags')
        ).order_by('-shared_tags', '-rating', '-view_count')
        
        # If no tag matches, fall back to same genre
        if not similar_videos.exists():
            similar_videos = VideoContent.objects.filter(
                genre__icontains=current_video.genre.split(',')[0].strip(),
                approval_status='APPROVED'
            ).exclude(
                id=current_video.id
            ).order_by('-rating', '-view_count')
        
        return similar_videos.distinct()[:8]
