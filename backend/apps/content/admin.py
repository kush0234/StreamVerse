from django.contrib import admin
from .models import VideoContent, Episode, Music, WatchHistory, Watchlist, Tag, UserInteraction, ContentSimilarity
from .utils.auto_tagger import AutoTagger


class EpisodeInline(admin.TabularInline):
    model = Episode
    extra = 1
    fields = ["season_number", "episode_number", "title", "duration"]


@admin.register(VideoContent)
class VideoContentAdmin(admin.ModelAdmin):
    list_display = [
        "id", "title", "content_type", "genre",
        "is_coming_soon", "approval_status", "rating", "release_date", "created_at",
    ]
    list_filter = ["content_type", "genre", "is_coming_soon", "approval_status", "release_date"]
    list_editable = ["approval_status"]
    readonly_fields = ["view_count", "submitted_for_approval_at"]
    search_fields = ["title", "description"]
    ordering = ["-created_at"]
    inlines = [EpisodeInline]
    filter_horizontal = ["tags"]
    actions = ["generate_tags_action", "approve_content", "reject_content", "mark_as_coming_soon"]

    fieldsets = (
        ("Basic Information", {"fields": ("title", "description", "content_type", "genre", "release_date", "rating")}),
        ("Thumbnail", {"fields": ("thumbnail",)}),
        ("Video (Cloudinary Upload)", {"fields": ("video_url", "duration")}),
        ("YouTube Trailer", {"fields": ("youtube_trailer_url",), "classes": ("collapse",)}),
        ("Coming Soon", {"fields": ("is_coming_soon", "expected_release_date"), "classes": ("collapse",)}),
        ("Approval Workflow", {"fields": ("approval_status", "submitted_for_approval_at"), "classes": ("collapse",)}),
        ("Tags", {"fields": ("tags",), "classes": ("collapse",)}),
        ("Additional Info", {"fields": ("view_count",), "classes": ("collapse",)}),
    )

    def get_inlines(self, request, obj):
        if obj and obj.content_type == "SERIES":
            return [EpisodeInline]
        return []

    def save_model(self, request, obj, form, change):
        if 'video_url' in request.FILES:
            import cloudinary.uploader
            result = cloudinary.uploader.upload(request.FILES['video_url'], resource_type='video', folder='videos')
            obj.video_url = result['public_id']
        super().save_model(request, obj, form, change)
        if not obj.tags.exists():
            AutoTagger.apply_tags_to_content(obj)

    def generate_tags_action(self, request, queryset):
        count = sum(1 for content in queryset if AutoTagger.apply_tags_to_content(content) or True)
        self.message_user(request, f"Generated tags for {count} content items")
    generate_tags_action.short_description = "Generate tags for selected content"

    def approve_content(self, request, queryset):
        updated = queryset.update(approval_status='APPROVED')
        self.message_user(request, f"✅ Approved {updated} content items", level='SUCCESS')
    approve_content.short_description = "✅ Approve selected content"

    def reject_content(self, request, queryset):
        updated = queryset.update(approval_status='REJECTED')
        self.message_user(request, f"❌ Rejected {updated} content items", level='WARNING')
    reject_content.short_description = "❌ Reject selected content"

    def mark_as_coming_soon(self, request, queryset):
        updated = queryset.update(is_coming_soon=True)
        self.message_user(request, f"Marked {updated} content items as coming soon")
    mark_as_coming_soon.short_description = "Mark as Coming Soon"


@admin.register(Episode)
class EpisodeAdmin(admin.ModelAdmin):
    list_display = ["series", "season_number", "episode_number", "title", "duration", "approval_status"]
    list_filter = ["series", "season_number", "approval_status"]
    list_editable = ["approval_status"]
    search_fields = ["title", "series__title"]
    ordering = ["series", "season_number", "episode_number"]

    def save_model(self, request, obj, form, change):
        if 'video_url' in request.FILES:
            import cloudinary.uploader
            result = cloudinary.uploader.upload(request.FILES['video_url'], resource_type='video', folder='episodes')
            obj.video_url = result['public_id']
        super().save_model(request, obj, form, change)


@admin.register(Music)
class MusicAdmin(admin.ModelAdmin):
    list_display = ["title", "artist", "album", "genre", "release_date", "duration"]
    list_filter = ["genre", "release_date", "artist"]
    search_fields = ["title", "artist", "album"]
    ordering = ["-created_at"]


@admin.register(WatchHistory)
class WatchHistoryAdmin(admin.ModelAdmin):
    list_display = ["user", "profile", "media_type", "video", "music", "duration_watched", "completed", "play_count", "updated_at"]
    list_filter = ["media_type", "completed", "updated_at"]
    search_fields = ["user__username", "profile__name", "video__title", "music__title"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Watchlist)
class WatchlistAdmin(admin.ModelAdmin):
    list_display = ["profile", "video", "music", "added_at"]
    list_filter = ["added_at"]
    search_fields = ["profile__name", "video__title", "music__title"]


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "auto_generated", "usage_count", "created_at"]
    list_filter = ["category", "auto_generated"]
    search_fields = ["name"]
    readonly_fields = ["slug", "usage_count", "created_at"]
    ordering = ["-usage_count", "name"]


@admin.register(UserInteraction)
class UserInteractionAdmin(admin.ModelAdmin):
    list_display = ["user", "profile", "interaction_type", "get_content", "interaction_value", "duration", "created_at"]
    list_filter = ["interaction_type", "created_at"]
    search_fields = ["user__username", "profile__name", "video__title", "music__title"]
    readonly_fields = ["created_at"]

    def get_content(self, obj):
        if obj.video:
            return f"Video: {obj.video.title}"
        elif obj.music:
            return f"Music: {obj.music.title}"
        elif obj.episode:
            return f"Episode: {obj.episode.title}"
        return "No content"
    get_content.short_description = "Content"


@admin.register(ContentSimilarity)
class ContentSimilarityAdmin(admin.ModelAdmin):
    list_display = ["get_content_pair", "similarity_type", "similarity_score", "updated_at"]
    list_filter = ["similarity_type"]
    readonly_fields = ["created_at", "updated_at"]

    def get_content_pair(self, obj):
        if obj.video_a and obj.video_b:
            return f"{obj.video_a.title} ↔ {obj.video_b.title}"
        elif obj.music_a and obj.music_b:
            return f"{obj.music_a.title} ↔ {obj.music_b.title}"
        return "Invalid pair"
    get_content_pair.short_description = "Content Pair"
