from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class FeedbackCategory(models.Model):
    """Categories for organizing feedback"""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=10, default='💬')
    color = models.CharField(max_length=20, default='blue')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = 'Feedback Categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Feedback(models.Model):
    """Main feedback model with voting and status tracking"""
    
    STATUS_CHOICES = (
        ('SUBMITTED', 'Submitted'),
        ('UNDER_REVIEW', 'Under Review'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CLOSED', 'Closed'),
        ('REJECTED', 'Rejected'),
    )
    
    PRIORITY_CHOICES = (
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    )
    
    # Basic Information
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feedbacks')
    category = models.ForeignKey(FeedbackCategory, on_delete=models.SET_NULL, null=True, related_name='feedbacks')
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # Status and Priority

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SUBMITTED')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='MEDIUM')
    
    # Voting
    upvotes = models.IntegerField(default=0)
    downvotes = models.IntegerField(default=0)
    
    # Admin Response
    admin_response = models.TextField(blank=True)
    admin_notes = models.TextField(blank=True)  # Internal notes
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_feedbacks')
    
    # Metadata
    is_public = models.BooleanField(default=True)
    is_pinned = models.BooleanField(default=False)
    views_count = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-is_pinned', '-created_at']
        verbose_name = 'Feedback'
        verbose_name_plural = 'Feedbacks'
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"
    
    @property
    def vote_score(self):
        return self.upvotes - self.downvotes
    
    def mark_resolved(self):
        self.status = 'COMPLETED'
        self.resolved_at = timezone.now()
        self.save()


class FeedbackVote(models.Model):
    """Track user votes on feedback"""
    
    VOTE_CHOICES = (
        ('UP', 'Upvote'),
        ('DOWN', 'Downvote'),
    )
    
    feedback = models.ForeignKey(Feedback, on_delete=models.CASCADE, related_name='votes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    vote_type = models.CharField(max_length=4, choices=VOTE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('feedback', 'user')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.vote_type} on {self.feedback.title}"


class FeedbackComment(models.Model):
    """Comments on feedback for discussion"""
    
    feedback = models.ForeignKey(Feedback, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    comment = models.TextField()
    is_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment by {self.user.username} on {self.feedback.title}"


class FeedbackAttachment(models.Model):
    """File attachments for feedback (screenshots, etc.)"""
    
    feedback = models.ForeignKey(Feedback, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='feedback_attachments/')
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50)
    file_size = models.IntegerField()  # in bytes
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Attachment for {self.feedback.title}"
