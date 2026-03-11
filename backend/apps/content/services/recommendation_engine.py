from django.db.models import Q, Count, Avg, F, Sum, Case, When, FloatField
from django.utils import timezone
from datetime import timedelta
from collections import defaultdict, Counter
import math

from ..models import (
    VideoContent, Music, Episode, Tag, VideoWatchHistory, 
    Watchlist, UserInteraction, ContentSimilarity, MusicListenHistory
)
from apps.feedback.models import Feedback


class RecommendationEngine:
    """
    Hybrid Recommendation System combining Rule-Based and Collaborative Filtering
    """
    
    def __init__(self):
        self.interaction_weights = {
            'VIEW': 1.0,
            'LIKE': 3.0,
            'DISLIKE': -2.0,
            'SHARE': 2.5,
            'WATCHLIST_ADD': 2.0,
            'WATCHLIST_REMOVE': -1.0,
            'PLAY': 1.5,
            'COMPLETE': 4.0,
            'SKIP': -0.5,
        }
    
    def get_continue_watching(self, user, profile=None, limit=10):
        """Get videos/episodes user can continue watching"""
        if not profile:
            profile = user.profiles.first()
        
        continue_watching = VideoWatchHistory.objects.filter(
            user=user,
            profile=profile,
            completed=False,
            duration_watched__gt=0
        ).select_related('video', 'episode').order_by('-updated_at')[:limit]
        
        results = []
        for history in continue_watching:
            content = history.episode if history.episode else history.video
            total_duration = content.duration if content else 0
            progress_percentage = (history.duration_watched / total_duration * 100) if total_duration > 0 else 0
            
            results.append({
                'content': content,
                'content_type': 'episode' if history.episode else 'video',
                'progress_percentage': round(progress_percentage, 1),
                'duration_watched': history.duration_watched,
                'last_watched': history.updated_at,
            })
        
        return results
    
    def get_trending_videos(self, limit=20, days=7):
        """Get trending videos based on recent views and interactions"""
        since_date = timezone.now() - timedelta(days=days)
        
        trending = VideoContent.objects.filter(
            approval_status='APPROVED'
        ).annotate(
            recent_views=Count(
                'watch_history',
                filter=Q(watch_history__updated_at__gte=since_date)
            ),
            recent_interactions=Count(
                'userinteraction',
                filter=Q(
                    userinteraction__created_at__gte=since_date,
                    userinteraction__interaction_type__in=['VIEW', 'LIKE', 'SHARE', 'COMPLETE']
                )
            ),
            trending_score=F('recent_views') + F('recent_interactions') * 2 + F('view_count') * 0.1
        ).filter(
            trending_score__gt=0
        ).order_by('-trending_score')[:limit]
        
        return trending
    
    def get_trending_music(self, limit=20, days=7):
        """Get trending music based on recent plays and interactions"""
        since_date = timezone.now() - timedelta(days=days)
        
        trending = Music.objects.annotate(
            recent_plays=Count(
                'listen_history',
                filter=Q(listen_history__updated_at__gte=since_date)
            ),
            recent_interactions=Count(
                'userinteraction',
                filter=Q(
                    userinteraction__created_at__gte=since_date,
                    userinteraction__interaction_type__in=['PLAY', 'LIKE', 'SHARE', 'COMPLETE']
                )
            ),
            trending_score=F('recent_plays') + F('recent_interactions') * 2 + F('play_count') * 0.1
        ).filter(
            trending_score__gt=0
        ).order_by('-trending_score')[:limit]
        
        return trending
    
    def get_because_you_watched(self, user, profile=None, limit=15):
        """Get video recommendations based on watch history"""
        if not profile:
            profile = user.profiles.first()
        
        # Get user's recently watched content
        recent_watches = VideoWatchHistory.objects.filter(
            user=user,
            profile=profile,
            updated_at__gte=timezone.now() - timedelta(days=30)
        ).select_related('video').values_list('video_id', flat=True)
        
        if not recent_watches:
            return self.get_trending_videos(limit=limit)
        
        # Get similar content based on genres and tags
        watched_videos = VideoContent.objects.filter(id__in=recent_watches)
        
        # Collect genres and tags from watched content
        genres = set()
        tag_ids = set()
        
        for video in watched_videos:
            if video.genre:
                genres.add(video.genre.lower())
            tag_ids.update(video.tags.values_list('id', flat=True))
        
        # Find similar content
        genre_whens = [When(genre__icontains=genre, then=1.0) for genre in genres]
        
        similar_videos = VideoContent.objects.filter(
            approval_status='APPROVED'
        ).exclude(
            id__in=recent_watches
        ).annotate(
            genre_match=Case(
                *genre_whens,
                default=0.0,
                output_field=FloatField()
            ),
            tag_match_count=Count('tags', filter=Q(tags__id__in=tag_ids)),
            similarity_score=F('genre_match') * 2 + F('tag_match_count') + F('view_count') * 0.001
        ).filter(
            similarity_score__gt=0
        ).order_by('-similarity_score')[:limit]
        
        return similar_videos
    
    def get_because_you_listened(self, user, profile=None, limit=15):
        """Get music recommendations based on listening history"""
        if not profile:
            profile = user.profiles.first()
        
        # Get user's recently listened music
        recent_listens = MusicListenHistory.objects.filter(
            user=user,
            profile=profile,
            updated_at__gte=timezone.now() - timedelta(days=30)
        ).select_related('music').values_list('music_id', flat=True)
        
        if not recent_listens:
            return self.get_trending_music(limit=limit)
        
        # Get similar music based on genres and artists
        listened_music = Music.objects.filter(id__in=recent_listens)
        
        # Collect genres and artists from listened content
        genres = set()
        artists = set()
        
        for music in listened_music:
            if music.genre:
                genres.add(music.genre.lower())
            if music.artist:
                artists.add(music.artist.lower())
        
        # Find similar music
        genre_whens = [When(genre__icontains=genre, then=1.0) for genre in genres]
        artist_whens = [When(artist__icontains=artist, then=1.0) for artist in artists]
        
        similar_music = Music.objects.exclude(
            id__in=recent_listens
        ).annotate(
            genre_match=Case(
                *genre_whens,
                default=0.0,
                output_field=FloatField()
            ),
            artist_match=Case(
                *artist_whens,
                default=0.0,
                output_field=FloatField()
            ),
            similarity_score=F('genre_match') * 2 + F('artist_match') * 3 + F('play_count') * 0.001
        ).filter(
            similarity_score__gt=0
        ).order_by('-similarity_score')[:limit]
        
        return similar_music
    
    def get_users_also_liked(self, content_id, content_type='video', limit=15):
        """Get content that users who liked this content also liked"""
        if content_type == 'video':
            # Find users who liked this video
            users_who_liked = UserInteraction.objects.filter(
                video_id=content_id,
                interaction_type__in=['LIKE', 'COMPLETE', 'WATCHLIST_ADD']
            ).values_list('user_id', flat=True)
            
            if not users_who_liked:
                return VideoContent.objects.none()
            
            # Find other videos these users liked
            also_liked = VideoContent.objects.filter(
                userinteraction__user_id__in=users_who_liked,
                userinteraction__interaction_type__in=['LIKE', 'COMPLETE', 'WATCHLIST_ADD'],
                approval_status='APPROVED'
            ).exclude(
                id=content_id
            ).annotate(
                like_count=Count('userinteraction')
            ).order_by('-like_count')[:limit]
            
        else:  # music
            # Find users who liked this music
            users_who_liked = UserInteraction.objects.filter(
                music_id=content_id,
                interaction_type__in=['LIKE', 'COMPLETE', 'PLAY']
            ).values_list('user_id', flat=True)
            
            if not users_who_liked:
                return Music.objects.none()
            
            # Find other music these users liked
            also_liked = Music.objects.filter(
                userinteraction__user_id__in=users_who_liked,
                userinteraction__interaction_type__in=['LIKE', 'COMPLETE', 'PLAY']
            ).exclude(
                id=content_id
            ).annotate(
                like_count=Count('userinteraction')
            ).order_by('-like_count')[:limit]
        
        return also_liked
    
    def get_top_video_picks(self, user, profile=None, limit=20):
        """Get personalized top video picks for user"""
        if not profile:
            profile = user.profiles.first()
        
        # Get user preferences from history
        user_genres = self._get_user_preferred_genres(user, profile, 'video')
        user_tags = self._get_user_preferred_tags(user, profile, 'video')
        
        # Calculate personalized scores
        top_picks = VideoContent.objects.filter(
            approval_status='APPROVED'
        ).exclude(
            # Exclude already watched content
            watch_history__user=user,
            watch_history__profile=profile
        ).annotate(
            genre_score=Case(
                *[When(genre__icontains=genre, then=score) for genre, score in user_genres.items()],
                default=0.0,
                output_field=FloatField()
            ),
            tag_score=Sum(
                Case(
                    *[When(tags__id=tag_id, then=score) for tag_id, score in user_tags.items()],
                    default=0.0,
                    output_field=FloatField()
                )
            ),
            popularity_score=F('view_count') * 0.001 + F('rating') * 0.5,
            total_score=F('genre_score') * 3 + F('tag_score') * 2 + F('popularity_score')
        ).filter(
            total_score__gt=0
        ).order_by('-total_score')[:limit]
        
        return top_picks
    
    def get_top_music_picks(self, user, profile=None, limit=20):
        """Get personalized top music picks for user"""
        if not profile:
            profile = user.profiles.first()
        
        # Get user preferences from history
        user_genres = self._get_user_preferred_genres(user, profile, 'music')
        user_artists = self._get_user_preferred_artists(user, profile)
        
        # Calculate personalized scores
        top_picks = Music.objects.exclude(
            # Exclude already listened content
            listen_history__user=user,
            listen_history__profile=profile
        ).annotate(
            genre_score=Case(
                *[When(genre__icontains=genre, then=score) for genre, score in user_genres.items()],
                default=0.0,
                output_field=FloatField()
            ),
            artist_score=Case(
                *[When(artist__icontains=artist, then=score) for artist, score in user_artists.items()],
                default=0.0,
                output_field=FloatField()
            ),
            popularity_score=F('play_count') * 0.001,
            total_score=F('genre_score') * 3 + F('artist_score') * 4 + F('popularity_score')
        ).filter(
            total_score__gt=0
        ).order_by('-total_score')[:limit]
        
        return top_picks
    
    def _get_user_preferred_genres(self, user, profile, content_type='video'):
        """Get user's preferred genres with scores"""
        if content_type == 'video':
            # Get genres from watch history
            content_genres = VideoWatchHistory.objects.filter(
                user=user, profile=profile
            ).select_related('video').values_list('video__genre', flat=True)
        else:
            # Get genres from music listen history
            content_genres = MusicListenHistory.objects.filter(
                user=user, profile=profile
            ).select_related('music').values_list('music__genre', flat=True)
        
        # Count genre preferences
        genre_counts = Counter([genre.lower() for genre in content_genres if genre])
        
        # Convert to scores (normalize)
        max_count = max(genre_counts.values()) if genre_counts else 1
        genre_scores = {genre: count / max_count for genre, count in genre_counts.items()}
        
        return genre_scores
    
    def _get_user_preferred_tags(self, user, profile, content_type='video'):
        """Get user's preferred tags with scores"""
        if content_type == 'video':
            # Get tags from watched videos
            watched_videos = VideoWatchHistory.objects.filter(
                user=user, profile=profile
            ).values_list('video_id', flat=True)
            
            tag_counts = Counter()
            for video_id in watched_videos:
                video_tags = VideoContent.objects.get(id=video_id).tags.values_list('id', flat=True)
                tag_counts.update(video_tags)
        else:
            # For music, we don't have tags yet, return empty
            return {}
        
        # Convert to scores
        max_count = max(tag_counts.values()) if tag_counts else 1
        tag_scores = {tag_id: count / max_count for tag_id, count in tag_counts.items()}
        
        return tag_scores
    
    def _get_user_preferred_artists(self, user, profile):
        """Get user's preferred artists with scores"""
        listened_content = MusicListenHistory.objects.filter(
            user=user, profile=profile
        ).select_related('music').values_list('music__artist', flat=True)
        
        # Count artist preferences
        artist_counts = Counter([artist.lower() for artist in listened_content if artist])
        
        # Convert to scores
        max_count = max(artist_counts.values()) if artist_counts else 1
        artist_scores = {artist: count / max_count for artist, count in artist_counts.items()}
        
        return artist_scores
    
    def calculate_content_similarity(self, content_a, content_b, content_type='video'):
        """Calculate similarity between two content items"""
        if content_type == 'video':
            return self._calculate_video_similarity(content_a, content_b)
        else:
            return self._calculate_music_similarity(content_a, content_b)
    
    def _calculate_video_similarity(self, video_a, video_b):
        """Calculate similarity between two videos"""
        similarity_score = 0.0
        
        # Genre similarity
        if video_a.genre and video_b.genre:
            if video_a.genre.lower() == video_b.genre.lower():
                similarity_score += 0.4
        
        # Tag similarity
        tags_a = set(video_a.tags.values_list('id', flat=True))
        tags_b = set(video_b.tags.values_list('id', flat=True))
        
        if tags_a and tags_b:
            jaccard_similarity = len(tags_a.intersection(tags_b)) / len(tags_a.union(tags_b))
            similarity_score += jaccard_similarity * 0.4
        
        # Content type similarity
        if video_a.content_type == video_b.content_type:
            similarity_score += 0.2
        
        return min(similarity_score, 1.0)
    
    def _calculate_music_similarity(self, music_a, music_b):
        """Calculate similarity between two music items"""
        similarity_score = 0.0
        
        # Genre similarity
        if music_a.genre and music_b.genre:
            if music_a.genre.lower() == music_b.genre.lower():
                similarity_score += 0.5
        
        # Artist similarity
        if music_a.artist and music_b.artist:
            if music_a.artist.lower() == music_b.artist.lower():
                similarity_score += 0.4
        
        # Album similarity
        if music_a.album and music_b.album:
            if music_a.album.lower() == music_b.album.lower():
                similarity_score += 0.1
        
        return min(similarity_score, 1.0)
    
    def update_similarity_scores(self, content_type='video', batch_size=100):
        """Update similarity scores for content items"""
        if content_type == 'video':
            contents = VideoContent.objects.filter(approval_status='APPROVED')
        else:
            contents = Music.objects.all()
        
        content_list = list(contents)
        
        for i, content_a in enumerate(content_list):
            for content_b in content_list[i+1:]:
                similarity_score = self.calculate_content_similarity(
                    content_a, content_b, content_type
                )
                
                if similarity_score > 0.1:  # Only store meaningful similarities
                    if content_type == 'video':
                        ContentSimilarity.objects.update_or_create(
                            video_a=content_a,
                            video_b=content_b,
                            similarity_type='HYBRID',
                            defaults={'similarity_score': similarity_score}
                        )
                    else:
                        ContentSimilarity.objects.update_or_create(
                            music_a=content_a,
                            music_b=content_b,
                            similarity_type='HYBRID',
                            defaults={'similarity_score': similarity_score}
                        )
    
    def record_interaction(self, user, profile, interaction_type, video=None, music=None, episode=None, duration=0):
        """Record user interaction for recommendation system"""
        interaction_value = self.interaction_weights.get(interaction_type, 1.0)
        
        UserInteraction.objects.create(
            user=user,
            profile=profile,
            video=video,
            music=music,
            episode=episode,
            interaction_type=interaction_type,
            interaction_value=interaction_value,
            duration=duration
        )