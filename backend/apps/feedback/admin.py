from django.contrib import admin
from .models import FeedbackCategory, Feedback, FeedbackVote, FeedbackComment, FeedbackAttachment


@admin.register(FeedbackCategory)
class FeedbackCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'icon', 'color', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}


class FeedbackCommentInline(admin.TabularInline):
    model = FeedbackComment
    extra = 0
    readonly_fields = ('user', 'created_at')


class FeedbackAttachmentInline(admin.TabularInline):
    model = FeedbackAttachment
    extra = 0
    readonly_fields = ('uploaded_at',)


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'category', 'status', 'priority', 'vote_score', 'is_pinned', 'created_at')
    list_filter = ('status', 'priority', 'category', 'is_public', 'is_pinned', 'created_at')
    search_fields = ('title', 'description', 'user__username')
    readonly_fields = ('upvotes', 'downvotes', 'vote_score', 'views_count', 'created_at', 'updated_at')
    inlines = [FeedbackCommentInline, FeedbackAttachmentInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'category', 'title', 'description')
        }),
        ('Status & Priority', {
            'fields': ('status', 'priority', 'assigned_to')
        }),
        ('Voting', {
            'fields': ('upvotes', 'downvotes', 'vote_score', 'views_count')
        }),
        ('Admin Response', {
            'fields': ('admin_response', 'admin_notes')
        }),
        ('Settings', {
            'fields': ('is_public', 'is_pinned')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'resolved_at')
        }),
    )


@admin.register(FeedbackVote)
class FeedbackVoteAdmin(admin.ModelAdmin):
    list_display = ('feedback', 'user', 'vote_type', 'created_at')
    list_filter = ('vote_type', 'created_at')
    search_fields = ('feedback__title', 'user__username')


@admin.register(FeedbackComment)
class FeedbackCommentAdmin(admin.ModelAdmin):
    list_display = ('feedback', 'user', 'is_admin', 'created_at')
    list_filter = ('is_admin', 'created_at')
    search_fields = ('feedback__title', 'user__username', 'comment')
