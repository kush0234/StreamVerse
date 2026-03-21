from rest_framework import serializers
from .models import VideoContent, Episode, Music, VideoWatchHistory, Watchlist, Tag


class EpisodeSerializer(serializers.ModelSerializer):
    video_url = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = Episode
        fields = "__all__"

    def get_video_url(self, obj):
        """Return video URL from either local or Cloudinary"""
        if obj.video_file:
            # Local file
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.video_file.url)
            return obj.video_file.url
        elif obj.video_url:
            # Cloudinary
            try:
                return obj.video_url.url
            except:
                return None
        return None

    def get_thumbnail(self, obj):
        if obj.thumbnail:
            try:
                return obj.thumbnail.url
            except:
                return None
        return None


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug', 'category', 'auto_generated', 'usage_count']
        read_only_fields = ['slug', 'usage_count']


class VideoContentSerializer(serializers.ModelSerializer):
    episodes = EpisodeSerializer(many=True, read_only=True)
    episode_count = serializers.SerializerMethodField()
    in_watchlist = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()
    video_url = serializers.SerializerMethodField()
    trailer_url = serializers.SerializerMethodField()
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Tag.objects.all(),
        write_only=True,
        required=False,
        source='tags'
    )

    class Meta:
        model = VideoContent
        fields = "__all__"

    def get_episode_count(self, obj):
        if obj.content_type == "SERIES":
            return obj.episodes.count()
        return 0

    def get_in_watchlist(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            profile_id = request.query_params.get('profile')
            if profile_id:
                return Watchlist.objects.filter(
                    profile_id=profile_id,
                    video=obj
                ).exists()
        return False

    def get_thumbnail(self, obj):
        if obj.thumbnail:
            try:
                return obj.thumbnail.url
            except:
                return None
        return None

    def get_video_url(self, obj):
        """Return appropriate video URL based on storage type"""
        if obj.is_public_domain and obj.video_file:
            # Local file - return full URL
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.video_file.url)
            return obj.video_file.url
        elif not obj.is_public_domain and obj.youtube_trailer_url:
            # YouTube embed URL
            return obj.youtube_trailer_url
        return None

    def get_trailer_url(self, obj):
        if obj.trailer_url:
            try:
                return obj.trailer_url.url
            except:
                return None
        return None


class VideoContentMiniSerializer(serializers.ModelSerializer):
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = VideoContent
        fields = ["id", "title", "thumbnail", "duration", "content_type"]

    def get_thumbnail(self, obj):
        if obj.thumbnail:
            try:
                return obj.thumbnail.url
            except:
                return None
        return None


class EpisodeMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Episode
        fields = ["id", "season_number", "episode_number", "title", "duration"]


class VideoWatchHistorySerializer(serializers.ModelSerializer):
    video = VideoContentMiniSerializer(read_only=True)
    episode = EpisodeMiniSerializer(read_only=True)

    class Meta:
        model = VideoWatchHistory
        fields = [
            "id",
            "video",
            "episode",
            "duration_watched",
            "completed",
            "updated_at",
        ]


class ArtistSerializer(serializers.Serializer):
    """Virtual Artist serializer - aggregates data from Music model"""
    name = serializers.CharField()
    track_count = serializers.IntegerField()
    total_plays = serializers.IntegerField()
    genres = serializers.ListField(child=serializers.CharField())
    thumbnail = serializers.URLField(allow_null=True)


class AlbumSerializer(serializers.Serializer):
    """Virtual Album serializer - aggregates data from Music model"""
    title = serializers.CharField()
    artist = serializers.CharField()
    track_count = serializers.IntegerField()
    total_duration = serializers.IntegerField()
    total_duration_formatted = serializers.CharField()
    release_date = serializers.DateField()
    thumbnail = serializers.URLField(allow_null=True)


class MusicSerializer(serializers.ModelSerializer):
    duration_formatted = serializers.SerializerMethodField()
    in_watchlist = serializers.SerializerMethodField()
    audio_url = serializers.SerializerMethodField()

    class Meta:
        model = Music
        fields = [
            'id', 'title', 'artist', 'album', 'genre', 'release_date',
            'audio_url', 'duration', 'duration_formatted',
            'play_count', 'created_at', 'in_watchlist'
        ]

    def get_duration_formatted(self, obj):
        minutes = obj.duration // 60
        seconds = obj.duration % 60
        return f"{minutes}:{seconds:02d}"

    def get_in_watchlist(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            profile_id = request.query_params.get('profile')
            if profile_id:
                return Watchlist.objects.filter(
                    profile_id=profile_id,
                    music=obj
                ).exists()
        return False

    def get_audio_url(self, obj):
        if obj.audio_file:
            # CloudinaryField returns the full URL via .url property
            return obj.audio_file.url
        return None


class WatchlistSerializer(serializers.ModelSerializer):
    video = VideoContentMiniSerializer(read_only=True)
    music = serializers.SerializerMethodField()

    class Meta:
        model = Watchlist
        fields = ["id", "video", "music", "added_at"]

    def get_music(self, obj):
        if obj.music:
            return {
                "id": obj.music.id,
                "title": obj.music.title,
                "artist": obj.music.artist,
            }
        return None


class ContinueWatchingSerializer(serializers.Serializer):
    """Serializer for continue watching recommendations"""
    content = serializers.SerializerMethodField()
    content_type = serializers.CharField()
    progress_percentage = serializers.FloatField()
    duration_watched = serializers.IntegerField()
    last_watched = serializers.DateTimeField()

    def get_content(self, obj):
        content = obj['content']
        if obj['content_type'] == 'episode':
            return {
                'id': content.id,
                'title': content.title,
                'season_number': content.season_number,
                'episode_number': content.episode_number,
                'duration': content.duration,
                'series_title': content.series.title,
                'series_id': content.series.id,
                'thumbnail': content.thumbnail.url if content.thumbnail else None,
            }
        else:
            return {
                'id': content.id,
                'title': content.title,
                'content_type': content.content_type,
                'duration': content.duration,
                'thumbnail': content.thumbnail.url if content.thumbnail else None,
            }


class RecommendationVideoSerializer(serializers.ModelSerializer):
    """Simplified video serializer for recommendations"""
    thumbnail = serializers.SerializerMethodField()
    episode_count = serializers.SerializerMethodField()
    tags = TagSerializer(many=True, read_only=True)

    class Meta:
        model = VideoContent
        fields = [
            'id', 'title', 'description', 'genre', 'release_date',
            'rating', 'content_type', 'thumbnail', 'duration',
            'view_count', 'episode_count', 'tags'
        ]

    def get_thumbnail(self, obj):
        if obj.thumbnail:
            try:
                return obj.thumbnail.url
            except:
                return None
        return None

    def get_episode_count(self, obj):
        if obj.content_type == "SERIES":
            return obj.episodes.count()
        return 0


class RecommendationMusicSerializer(serializers.ModelSerializer):
    """Simplified music serializer for recommendations"""
    duration_formatted = serializers.SerializerMethodField()

    class Meta:
        model = Music
        fields = [
            'id', 'title', 'artist', 'album', 'genre', 'release_date',
            'duration', 'duration_formatted', 'play_count'
        ]

    def get_duration_formatted(self, obj):
        minutes = obj.duration // 60
        seconds = obj.duration % 60
        return f"{minutes}:{seconds:02d}"


class HomeRecommendationsSerializer(serializers.Serializer):
    """Serializer for home page recommendations"""
    continue_watching = ContinueWatchingSerializer(many=True)
    trending_videos = RecommendationVideoSerializer(many=True)
    top_video_picks = RecommendationVideoSerializer(many=True)
    because_you_watched = RecommendationVideoSerializer(many=True)
    trending_music = RecommendationMusicSerializer(many=True)
    top_music_picks = RecommendationMusicSerializer(many=True)
    because_you_listened = RecommendationMusicSerializer(many=True)
