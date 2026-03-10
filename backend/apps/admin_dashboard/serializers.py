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
    """Serializer for video management with hybrid storage support"""
    episodes_count = serializers.SerializerMethodField(read_only=True)
    thumbnail_url = serializers.SerializerMethodField(read_only=True)
    video_url = serializers.SerializerMethodField(read_only=True)
    trailer_url = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = VideoContent
        fields = '__all__'
        extra_kwargs = {
            'thumbnail': {'write_only': False, 'required': False},
            'video_file': {'write_only': False, 'required': False},
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
    
    def get_video_url(self, obj):
        """Return appropriate video URL based on storage type"""
        if obj.is_public_domain and obj.video_file:
            # Local file
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.video_file.url)
            return obj.video_file.url
        elif not obj.is_public_domain and obj.youtube_trailer_url:
            # YouTube embed
            return obj.youtube_trailer_url
        return None
    
    def get_trailer_url(self, obj):
        if obj.trailer_url:
            try:
                return obj.trailer_url.url
            except:
                return None
        return None
    
    def to_representation(self, instance):
        """Add thumbnail_url to response"""
        data = super().to_representation(instance)
        # Add the URL version for frontend
        data['thumbnail'] = self.get_thumbnail_url(instance)
        data['video_url'] = self.get_video_url(instance)
        return data


class EpisodeManagementSerializer(serializers.ModelSerializer):
    """Serializer for episode management with hybrid storage support"""
    series_title = serializers.CharField(source='series.title', read_only=True)
    video_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Episode
        fields = '__all__'
        extra_kwargs = {
            'thumbnail': {'write_only': False, 'required': False},
        }
    
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
    
    def get_thumbnail_url(self, obj):
        if obj.thumbnail:
            try:
                return obj.thumbnail.url
            except:
                return None
        return None
    
    def to_representation(self, instance):
        """Add thumbnail URL to response"""
        data = super().to_representation(instance)
        data['thumbnail'] = self.get_thumbnail_url(instance)
        return data


class MusicManagementSerializer(serializers.ModelSerializer):
    """Serializer for music management"""
    audio_url = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()
    
    class Meta:
        model = Music
        fields = '__all__'
    
    def get_audio_url(self, obj):
        if obj.audio_file:
            try:
                return obj.audio_file.url
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
