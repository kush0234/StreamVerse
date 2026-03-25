from django.db import models
from django.conf import settings
from django.utils.text import slugify
from cloudinary.models import CloudinaryField

class Tag(models.Model):
    """Tags for categorizing content"""
    CATEGORY_CHOICES = [
        ('GENRE', 'Genre'),
        ('MOOD', 'Mood'),
        ('THEME', 'Theme'),
        ('ERA', 'Era'),
        ('DURATION', 'Duration'),
        ('OTHER', 'Other'),
    ]

    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='OTHER')
    auto_generated = models.BooleanField(default=False, help_text='Tag was auto-generated')
    usage_count = models.IntegerField(default=0, help_text='Number of times this tag is used')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-usage_count', 'name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class VideoContent(models.Model):
    """Main model for movies and series"""
    CONTENT_TYPE_CHOICES = [
        ('MOVIE', 'Movie'),
        ('SERIES', 'Web Series'),
    ]

    APPROVAL_STATUS_CHOICES = [
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('NEEDS_CHANGES', 'Needs Changes'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    genre = models.CharField(max_length=100)
    release_date = models.DateField()
    rating = models.FloatField(default=0)
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES)
    thumbnail = CloudinaryField(
        'image',
        blank=True,
        null=True,
        folder='thumbnails',
        help_text="🖼️ Upload thumbnail image"
    )
    video_url = CloudinaryField(
        'video',
        blank=True,
        null=True,
        folder='videos',
        help_text="☁️ Upload video file — stored on Cloudinary"
    )
    trailer_url = CloudinaryField('video', blank=True, null=True, folder='videos')
    duration = models.IntegerField(
        blank=True,
        null=True,
        help_text="Duration in minutes"
    )
    view_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    youtube_trailer_url = models.URLField(
        blank=True,
        null=True,
        help_text="🎬 YouTube embed URL (format: https://www.youtube.com/embed/VIDEO_ID)"
    )

    # Coming Soon feature
    is_coming_soon = models.BooleanField(
        default=False,
        help_text="If True, content is marked as 'Coming Soon' and video upload is optional"
    )
    expected_release_date = models.DateField(
        blank=True,
        null=True,
        help_text='Expected release date for coming soon content'
    )

    # Approval workflow
    approval_status = models.CharField(
        max_length=20,
        choices=APPROVAL_STATUS_CHOICES,
        default='APPROVED',
        help_text='Content approval status'
    )
    submitted_for_approval_at = models.DateTimeField(blank=True, null=True)

    # Tags
    tags = models.ManyToManyField(Tag, blank=True, related_name='videos')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class Episode(models.Model):
    """Episodes for web series"""

    APPROVAL_STATUS_CHOICES = [
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]

    series = models.ForeignKey(
        VideoContent,
        on_delete=models.CASCADE,
        related_name='episodes',
        limit_choices_to={'content_type': 'SERIES'}
    )
    season_number = models.IntegerField()
    episode_number = models.IntegerField()
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    video_url = CloudinaryField(
        'video',
        blank=True,
        null=True,
        folder='episodes',
        help_text="☁️ Upload episode video — stored on Cloudinary"
    )
    thumbnail = CloudinaryField('image', blank=True, null=True, folder='thumbnails')
    duration = models.IntegerField(blank=True, null=True)

    # Approval workflow
    approval_status = models.CharField(
        max_length=20,
        choices=APPROVAL_STATUS_CHOICES,
        default='PENDING',
        help_text='Episode approval status'
    )

    class Meta:
        ordering = ['season_number', 'episode_number']
        constraints = [
            models.UniqueConstraint(
                fields=['series', 'season_number', 'episode_number'],
                name='unique_episode_per_series'
            )
        ]

    def __str__(self):
        return f"{self.series.title} - S{self.season_number}E{self.episode_number}: {self.title}"


class Music(models.Model):
    """Music/audio content"""
    title = models.CharField(max_length=200)
    artist = models.CharField(max_length=200)
    album = models.CharField(max_length=200, blank=True, null=True)
    genre = models.CharField(max_length=100)
    release_date = models.DateField()
    audio_file = CloudinaryField('raw', blank=True, null=True, folder='music')
    duration = models.IntegerField(default=0, help_text='Duration in seconds')
    play_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Music'

    def __str__(self):
        return f"{self.title} - {self.artist}"

class VideoWatchHistory(models.Model):
    """Track user's watch progress"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    profile = models.ForeignKey('users.Profile', on_delete=models.CASCADE)
    video = models.ForeignKey(VideoContent, on_delete=models.CASCADE, related_name='watch_history')
    episode = models.ForeignKey(Episode, on_delete=models.CASCADE, blank=True, null=True, related_name='watch_history')
    duration_watched = models.IntegerField(default=0)
    completed = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Video Watch Histories'

    def __str__(self):
        return f"{self.user.username} - {self.video.title}"


class Watchlist(models.Model):
    """User's watchlist for videos and music"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    profile = models.ForeignKey('users.Profile', on_delete=models.CASCADE, related_name='watchlist')
    video = models.ForeignKey(VideoContent, on_delete=models.CASCADE, blank=True, null=True, related_name='in_watchlists')
    music = models.ForeignKey(Music, on_delete=models.CASCADE, blank=True, null=True, related_name='in_watchlists')
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['profile', 'video'],
                condition=models.Q(video__isnull=False),
                name='unique_profile_video'
            ),
            models.UniqueConstraint(
                fields=['profile', 'music'],
                condition=models.Q(music__isnull=False),
                name='unique_profile_music'
            ),
        ]

    def __str__(self):
        if self.video:
            return f"{self.user.username} - {self.video.title}"
        elif self.music:
            return f"{self.user.username} - {self.music.title}"
        return f"{self.user.username} - Watchlist Item"


class UserInteraction(models.Model):
    """Track user interactions for recommendation system"""
    INTERACTION_TYPES = [
        ('VIEW', 'View'),
        ('LIKE', 'Like'),
        ('DISLIKE', 'Dislike'),
        ('SHARE', 'Share'),
        ('WATCHLIST_ADD', 'Added to Watchlist'),
        ('WATCHLIST_REMOVE', 'Removed from Watchlist'),
        ('PLAY', 'Play'),
        ('PAUSE', 'Pause'),
        ('SKIP', 'Skip'),
        ('COMPLETE', 'Complete'),
        ('SEARCH', 'Search'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    profile = models.ForeignKey('users.Profile', on_delete=models.CASCADE)

    # Content references
    video = models.ForeignKey(VideoContent, on_delete=models.CASCADE, blank=True, null=True)
    music = models.ForeignKey(Music, on_delete=models.CASCADE, blank=True, null=True)
    episode = models.ForeignKey(Episode, on_delete=models.CASCADE, blank=True, null=True)

    interaction_type = models.CharField(max_length=20, choices=INTERACTION_TYPES)
    interaction_value = models.FloatField(default=1.0, help_text='Weight of interaction (1.0 = normal, 2.0 = strong positive, -1.0 = negative)')
    duration = models.IntegerField(default=0, help_text='Duration of interaction in seconds')

    # Context
    session_id = models.CharField(max_length=100, blank=True, null=True)
    device_type = models.CharField(max_length=50, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'interaction_type', '-created_at']),
            models.Index(fields=['profile', 'video', '-created_at']),
            models.Index(fields=['profile', 'music', '-created_at']),
        ]

    def __str__(self):
        content = self.video or self.music or self.episode
        return f"{self.user.username} - {self.interaction_type} - {content}"


class ContentSimilarity(models.Model):
    """Store similarity scores between content items"""
    SIMILARITY_TYPES = [
        ('GENRE', 'Genre Similarity'),
        ('TAG', 'Tag Similarity'),
        ('COLLABORATIVE', 'Collaborative Filtering'),
        ('HYBRID', 'Hybrid Score'),
    ]

    # Video to Video similarity
    video_a = models.ForeignKey(VideoContent, on_delete=models.CASCADE, blank=True, null=True, related_name='similarity_a')
    video_b = models.ForeignKey(VideoContent, on_delete=models.CASCADE, blank=True, null=True, related_name='similarity_b')

    # Music to Music similarity
    music_a = models.ForeignKey(Music, on_delete=models.CASCADE, blank=True, null=True, related_name='similarity_a')
    music_b = models.ForeignKey(Music, on_delete=models.CASCADE, blank=True, null=True, related_name='similarity_b')

    similarity_type = models.CharField(max_length=20, choices=SIMILARITY_TYPES)
    similarity_score = models.FloatField(help_text='Similarity score between 0.0 and 1.0')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['video_a', 'similarity_type', '-similarity_score']),
            models.Index(fields=['music_a', 'similarity_type', '-similarity_score']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['video_a', 'video_b', 'similarity_type'],
                condition=models.Q(video_a__isnull=False, video_b__isnull=False),
                name='unique_video_similarity'
            ),
            models.UniqueConstraint(
                fields=['music_a', 'music_b', 'similarity_type'],
                condition=models.Q(music_a__isnull=False, music_b__isnull=False),
                name='unique_music_similarity'
            ),
        ]

    def __str__(self):
        if self.video_a and self.video_b:
            return f"{self.video_a.title} <-> {self.video_b.title} ({self.similarity_score:.2f})"
        elif self.music_a and self.music_b:
            return f"{self.music_a.title} <-> {self.music_b.title} ({self.similarity_score:.2f})"
        return f"Similarity {self.similarity_score:.2f}"


class MusicListenHistory(models.Model):
    """Track user's music listening history"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    profile = models.ForeignKey('users.Profile', on_delete=models.CASCADE)
    music = models.ForeignKey(Music, on_delete=models.CASCADE, related_name='listen_history')

    duration_listened = models.IntegerField(default=0, help_text='Duration listened in seconds')
    completed = models.BooleanField(default=False)
    play_count = models.IntegerField(default=1)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', '-updated_at']),
            models.Index(fields=['profile', '-updated_at']),
            models.Index(fields=['music', '-updated_at']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.music.title}"
