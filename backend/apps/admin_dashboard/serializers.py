from rest_framework import serializers
from apps.content.models import VideoContent, Episode, Music
from apps.users.models import User, Subscription, PaymentHistory
from .models import ActivityLog


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard overview statistics"""
    total_users = serializers.IntegerField()
    total_videos = serializers.IntegerField()
    total_episodes = serializers.IntegerField()
    total_music = serializers.IntegerField()


class VideoManagementSerializer(serializers.ModelSerializer):
    """Serializer for video management"""
    episodes_count = serializers.SerializerMethodField(read_only=True)
    thumbnail_url = serializers.SerializerMethodField(read_only=True)
    video_url_display = serializers.SerializerMethodField(read_only=True)
    trailer_url_display = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = VideoContent
        fields = '__all__'
        extra_kwargs = {
            'thumbnail': {'required': False},
            'video_url': {'required': False, 'read_only': False, 'allow_null': True},
            'trailer_url': {'required': False},
        }

    def get_episodes_count(self, obj):
        if obj.content_type == 'SERIES':
            return obj.episodes.count()
        return 0

    def get_thumbnail_url(self, obj):
        if obj.thumbnail:
            try:
                return obj.thumbnail.url
            except:
                return None
        return None

    def get_video_url_display(self, obj):
        if obj.video_url:
            try:
                import cloudinary
                public_id = str(obj.video_url)
                url, _ = cloudinary.utils.cloudinary_url(
                    public_id,
                    resource_type='video',
                    secure=True
                )
                return url
            except:
                return None
        elif obj.youtube_trailer_url:
            return obj.youtube_trailer_url
        return None

    def get_trailer_url_display(self, obj):
        if obj.trailer_url:
            try:
                return obj.trailer_url.url
            except:
                return None
        return None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['thumbnail'] = self.get_thumbnail_url(instance)
        data['video_url'] = self.get_video_url_display(instance)
        return data


class EpisodeManagementSerializer(serializers.ModelSerializer):
    """Serializer for episode management"""
    series_title = serializers.CharField(source='series.title', read_only=True)
    video_url_display = serializers.SerializerMethodField(read_only=True)
    thumbnail_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Episode
        fields = '__all__'
        extra_kwargs = {
            'thumbnail': {'required': False},
            'video_url': {'required': False, 'read_only': False, 'allow_null': True},
        }

    def get_video_url_display(self, obj):
        if obj.video_url:
            try:
                import cloudinary
                public_id = str(obj.video_url)
                url, _ = cloudinary.utils.cloudinary_url(
                    public_id,
                    resource_type='video',
                    secure=True
                )
                return url
            except:
                return None
        return None

    def get_thumbnail_url(self, obj):
        if obj.thumbnail:
            try:
                return obj.thumbnail.url
            except:
                return None
        return None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['thumbnail'] = self.get_thumbnail_url(instance)
        data['video_url'] = self.get_video_url_display(instance)
        return data


class MusicManagementSerializer(serializers.ModelSerializer):
    """Serializer for music management"""
    audio_url = serializers.SerializerMethodField()

    class Meta:
        model = Music
        fields = '__all__'

    def get_audio_url(self, obj):
        if obj.audio_file:
            try:
                import cloudinary
                public_id = str(obj.audio_file)
                if not public_id.endswith('.mp3'):
                    public_id = public_id + '.mp3'
                url, _ = cloudinary.utils.cloudinary_url(
                    public_id,
                    resource_type="raw",
                )
                return url
            except Exception:
                return None
        return None


class AnalyticsSerializer(serializers.Serializer):
    """Serializer for analytics data"""
    # User analytics
    new_users_this_month = serializers.IntegerField()
    total_active_users = serializers.IntegerField()

    # Content analytics
    most_viewed_videos = serializers.ListField()
    most_played_music = serializers.ListField()


class ActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for activity logs"""
    username = serializers.CharField(source='user.username', read_only=True, allow_null=True)
    user_email = serializers.CharField(source='user.email', read_only=True, allow_null=True)
    icon = serializers.CharField(read_only=True)
    color = serializers.CharField(read_only=True)
    time_ago = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = [
            'id', 'activity_type', 'username', 'user_email', 'description',
            'metadata', 'icon', 'color', 'created_at', 'time_ago'
        ]

    def get_time_ago(self, obj):
        from django.utils import timezone
        from datetime import timedelta

        now = timezone.now()
        diff = now - obj.created_at

        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "Just now"
