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
    thumbnail = CloudinaryField('image', blank=True, null=True)
    video_url = CloudinaryField('video', blank=True, null=True)
    trailer_url = CloudinaryField('video', blank=True, null=True)
    duration = models.IntegerField(blank=True, null=True)
    view_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Hybrid storage fields
    is_public_domain = models.BooleanField(
        default=False,
        help_text="If True, video is stored locally. If False, uses YouTube trailer."
    )
    video_file = models.FileField(
        upload_to='videos/',
        blank=True,
        null=True,
        help_text="Local video file for public domain content"
    )
    youtube_trailer_url = models.URLField(
        blank=True,
        null=True,
        help_text="YouTube embed URL for non-public domain content trailers"
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
    video_url = CloudinaryField('video', blank=True, null=True)
    thumbnail = CloudinaryField('image', blank=True, null=True)
    duration = models.IntegerField()
    
    # Hybrid storage for episodes
    video_file = models.FileField(
        upload_to='episodes/',
        blank=True,
        null=True,
        help_text="Local video file for public domain episodes"
    )

    class Meta:
        ordering = ['season_number', 'episode_number']

    def __str__(self):
        return f"{self.series.title} - S{self.season_number}E{self.episode_number}: {self.title}"


class Music(models.Model):
    """Music/audio content"""
    title = models.CharField(max_length=200)
    artist = models.CharField(max_length=200)
    album = models.CharField(max_length=200, blank=True, null=True)
    genre = models.CharField(max_length=100)
    release_date = models.DateField()
    thumbnail = CloudinaryField('image', blank=True, null=True)
    audio_file = CloudinaryField('raw', blank=True, null=True)
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
