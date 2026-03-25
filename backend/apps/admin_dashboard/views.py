from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from .permissions import IsAdminUser, IsSuperAdmin

from apps.content.models import VideoContent, Episode, Music
from apps.users.models import User, Subscription, PaymentHistory
from .models import ActivityLog
from .serializers import (
    DashboardStatsSerializer,
    VideoManagementSerializer,
    EpisodeManagementSerializer,
    MusicManagementSerializer,
    AnalyticsSerializer,
    ActivityLogSerializer
)


class DashboardViewSet(viewsets.ViewSet):
    """Admin dashboard overview"""
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get dashboard overview statistics"""

        # Calculate stats
        total_users = User.objects.count()
        total_videos = VideoContent.objects.count()
        total_episodes = Episode.objects.count()
        total_music = Music.objects.count()

        data = {
            'total_users': total_users,
            'total_videos': total_videos,
            'total_episodes': total_episodes,
            'total_music': total_music,
        }

        serializer = DashboardStatsSerializer(data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recent_activities(self, request):
        """Get recent activities"""
        limit = int(request.query_params.get('limit', 20))
        activities = ActivityLog.objects.select_related('user')[:limit]
        serializer = ActivityLogSerializer(activities, many=True)
        return Response(serializer.data)


class VideoManagementViewSet(viewsets.ModelViewSet):
    """Manage videos (CRUD operations)"""
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    queryset = VideoContent.objects.all().order_by('-created_at')
    serializer_class = VideoManagementSerializer

    def perform_create(self, serializer):
        import cloudinary.uploader
        video_file = self.request.FILES.get('video_url')
        extra = {'video_url': None}  # prevent serializer from processing the file
        if video_file:
            result = cloudinary.uploader.upload(
                video_file,
                resource_type='video',
                folder='videos',
            )
            extra['video_url'] = result['public_id']

        video = serializer.save(approval_status='PENDING', **extra)

        from apps.content.utils.auto_tagger import AutoTagger
        AutoTagger.apply_tags_to_content(video)

        ActivityLog.log_activity(
            activity_type='VIDEO_UPLOADED',
            user=self.request.user,
            description=f'New {video.get_content_type_display().lower()} "{video.title}" was uploaded (Pending Approval)',
            metadata={'video_id': video.id, 'content_type': video.content_type, 'approval_status': 'PENDING'},
            request=self.request
        )

    def perform_update(self, serializer):
        import cloudinary.uploader
        video_file = self.request.FILES.get('video_url')
        extra = {}
        if video_file:
            result = cloudinary.uploader.upload(
                video_file,
                resource_type='video',
                folder='videos',
            )
            extra['video_url'] = result['public_id']
        else:
            # keep existing value — don't let serializer overwrite with empty
            extra['video_url'] = serializer.instance.video_url
        serializer.save(**extra)

    def perform_destroy(self, instance):
        # Log activity before deletion
        ActivityLog.log_activity(
            activity_type='CONTENT_DELETED',
            user=self.request.user,
            description=f'{instance.get_content_type_display()} "{instance.title}" was deleted',
            metadata={'video_id': instance.id, 'content_type': instance.content_type},
            request=self.request
        )
        instance.delete()

    def get_queryset(self):
        queryset = super().get_queryset()
        content_type = self.request.query_params.get('content_type', None)
        if content_type:
            queryset = queryset.filter(content_type=content_type)
        return queryset


class EpisodeManagementViewSet(viewsets.ModelViewSet):
    """Manage episodes (CRUD operations)"""
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    queryset = Episode.objects.all().select_related('series')
    serializer_class = EpisodeManagementSerializer

    def perform_create(self, serializer):
        import cloudinary.uploader
        video_file = self.request.FILES.get('video_url')
        extra = {'video_url': None}  # prevent serializer from processing the file
        if video_file:
            result = cloudinary.uploader.upload(
                video_file,
                resource_type='video',
                folder='episodes',
            )
            extra['video_url'] = result['public_id']

        episode = serializer.save(approval_status='PENDING', **extra)

        ActivityLog.log_activity(
            activity_type='EPISODE_ADDED',
            user=self.request.user,
            description=f'New episode "{episode.title}" added to series "{episode.series.title}" (Pending Approval)',
            metadata={
                'episode_id': episode.id,
                'series_id': episode.series.id,
                'season': episode.season_number,
                'episode': episode.episode_number,
                'approval_status': 'PENDING'
            },
            request=self.request
        )

    def perform_update(self, serializer):
        import cloudinary.uploader
        video_file = self.request.FILES.get('video_url')
        extra = {}
        if video_file:
            result = cloudinary.uploader.upload(
                video_file,
                resource_type='video',
                folder='episodes',
            )
            extra['video_url'] = result['public_id']
        else:
            extra['video_url'] = serializer.instance.video_url
        serializer.save(**extra)

    def perform_destroy(self, instance):
        # Log activity before deletion
        ActivityLog.log_activity(
            activity_type='CONTENT_DELETED',
            user=self.request.user,
            description=f'Episode "{instance.title}" was deleted from series "{instance.series.title}"',
            metadata={
                'episode_id': instance.id,
                'series_id': instance.series.id,
                'season': instance.season_number,
                'episode': instance.episode_number
            },
            request=self.request
        )
        instance.delete()

    def get_queryset(self):
        queryset = super().get_queryset()
        series_id = self.request.query_params.get('series_id', None)
        if series_id:
            queryset = queryset.filter(series_id=series_id)
        return queryset


class MusicManagementViewSet(viewsets.ModelViewSet):
    """Manage music (CRUD operations)"""
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    queryset = Music.objects.all().order_by('-created_at')
    serializer_class = MusicManagementSerializer


class AnalyticsViewSet(viewsets.ViewSet):
    """Analytics and reporting"""
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'])
    def overview(self, request):
        """Get analytics overview"""

        # Date calculations
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # User analytics
        new_users_this_month = User.objects.filter(
            date_joined__gte=month_start
        ).count()

        total_active_users = User.objects.filter(
            is_active=True
        ).count()

        # Content analytics
        most_viewed_videos = list(
            VideoContent.objects.order_by('-view_count')[:10].values(
                'id', 'title', 'view_count', 'content_type'
            )
        )

        most_played_music = list(
            Music.objects.order_by('-play_count')[:10].values(
                'id', 'title', 'artist', 'play_count'
            )
        )

        data = {
            'new_users_this_month': new_users_this_month,
            'total_active_users': total_active_users,
            'most_viewed_videos': most_viewed_videos,
            'most_played_music': most_played_music,
        }

        serializer = AnalyticsSerializer(data)
        return Response(serializer.data)
