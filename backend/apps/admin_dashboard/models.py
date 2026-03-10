from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class ActivityLog(models.Model):
    ACTIVITY_TYPES = (
        # User Activities
        ('USER_REGISTERED', 'User Registered'),
        ('USER_LOGIN', 'User Login'),
        ('USER_LOGOUT', 'User Logout'),
        ('PROFILE_CREATED', 'Profile Created'),
        ('PASSWORD_RESET', 'Password Reset'),
        
        # Content Activities
        ('VIDEO_UPLOADED', 'Video Uploaded'),
        ('EPISODE_ADDED', 'Episode Added'),
        ('MUSIC_UPLOADED', 'Music Uploaded'),
        ('CONTENT_DELETED', 'Content Deleted'),
        ('CONTENT_UPDATED', 'Content Updated'),
        
        # Subscription Activities
        ('SUBSCRIPTION_PURCHASED', 'Subscription Purchased'),
        ('SUBSCRIPTION_CANCELLED', 'Subscription Cancelled'),
        ('PAYMENT_SUCCESS', 'Payment Success'),
        ('PAYMENT_FAILED', 'Payment Failed'),
        
        # Feedback Activities
        ('FEEDBACK_SUBMITTED', 'Feedback Submitted'),
        ('FEEDBACK_UPDATED', 'Feedback Updated'),
        ('FEEDBACK_RESOLVED', 'Feedback Resolved'),
        
        # Admin Activities
        ('ADMIN_LOGIN', 'Admin Login'),
        ('CONTENT_MODERATED', 'Content Moderated'),
    )

    ACTIVITY_COLORS = {
        'USER_REGISTERED': 'green',
        'USER_LOGIN': 'blue',
        'USER_LOGOUT': 'gray',
        'PROFILE_CREATED': 'blue',
        'PASSWORD_RESET': 'yellow',
        'VIDEO_UPLOADED': 'purple',
        'EPISODE_ADDED': 'purple',
        'MUSIC_UPLOADED': 'green',
        'CONTENT_DELETED': 'red',
        'CONTENT_UPDATED': 'orange',
        'SUBSCRIPTION_PURCHASED': 'green',
        'SUBSCRIPTION_CANCELLED': 'red',
        'PAYMENT_SUCCESS': 'green',
        'PAYMENT_FAILED': 'red',
        'FEEDBACK_SUBMITTED': 'blue',
        'FEEDBACK_UPDATED': 'orange',
        'FEEDBACK_RESOLVED': 'green',
        'ADMIN_LOGIN': 'red',
        'CONTENT_MODERATED': 'orange',
    }

    ACTIVITY_ICONS = {
        'USER_REGISTERED': '👤',
        'USER_LOGIN': '🔐',
        'USER_LOGOUT': '🚪',
        'PROFILE_CREATED': '👥',
        'PASSWORD_RESET': '🔑',
        'VIDEO_UPLOADED': '🎬',
        'EPISODE_ADDED': '📺',
        'MUSIC_UPLOADED': '🎵',
        'CONTENT_DELETED': '🗑️',
        'CONTENT_UPDATED': '✏️',
        'SUBSCRIPTION_PURCHASED': '💳',
        'SUBSCRIPTION_CANCELLED': '❌',
        'PAYMENT_SUCCESS': '💰',
        'PAYMENT_FAILED': '⚠️',
        'FEEDBACK_SUBMITTED': '💭',
        'FEEDBACK_UPDATED': '✏️',
        'FEEDBACK_RESOLVED': '✅',
        'ADMIN_LOGIN': '🛡️',
        'CONTENT_MODERATED': '🛠️',
    }

    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPES)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    description = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)  # Store additional data
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Activity Log'
        verbose_name_plural = 'Activity Logs'

    def __str__(self):
        return f"{self.get_activity_type_display()} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"

    @property
    def icon(self):
        return self.ACTIVITY_ICONS.get(self.activity_type, '📝')

    @property
    def color(self):
        return self.ACTIVITY_COLORS.get(self.activity_type, 'gray')

    @classmethod
    def log_activity(cls, activity_type, user=None, description="", metadata=None, request=None):
        """Helper method to log activities"""
        ip_address = None
        user_agent = ""
        
        if request:
            ip_address = cls.get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')

        return cls.objects.create(
            activity_type=activity_type,
            user=user,
            description=description,
            metadata=metadata or {},
            ip_address=ip_address,
            user_agent=user_agent
        )

    @staticmethod
    def get_client_ip(request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip