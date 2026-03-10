from django.contrib import admin
from .models import VideoContent, Episode, Music, VideoWatchHistory, Watchlist, Tag
from .utils.auto_tagger import AutoTagger


class EpisodeInline(admin.TabularInline):
    model = Episode
    extra = 1
    fields = ["season_number", "episode_number", "title", "duration"]


@admin.register(VideoContent)
class VideoContentAdmin(admin.ModelAdmin):

    list_display = [
        "id",
        "title",
        "content_type",
        "genre",
        "is_public_domain",
        "is_coming_soon",
        "approval_status",
        "rating",
        "release_date",
        "created_at",
    ]

    list_filter = [
        "content_type",
        "genre",
        "is_public_domain",
        "is_coming_soon",
        "approval_status",
        "release_date",
    ]
    
    # Make approval status editable in list view
    list_editable = ["approval_status"]
    
    readonly_fields = ["view_count", "submitted_for_approval_at"]
    search_fields = ["title", "description"]
    ordering = ["-created_at"]
    inlines = [EpisodeInline]
    filter_horizontal = ["tags"]
    actions = ["generate_tags_action", "approve_content", "reject_content", "mark_as_coming_soon"]

    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "title",
                    "description",
                    "content_type",
                    "genre",
                    "release_date",
                    "rating",
                )
            },
        ),
        (
            "Coming Soon Feature",
            {
                "fields": (
                    "is_coming_soon",
                    "expected_release_date",
                ),
                "description": "Mark content as 'Coming Soon' - video upload becomes optional",
            },
        ),
        (
            "Approval Workflow",
            {
                "fields": (
                    "approval_status",
                    "submitted_for_approval_at",
                ),
                "description": "Content approval status - Only SuperAdmin can approve",
                "classes": ("wide",),
            },
        ),
        (
            "Streaming Type",
            {
                "fields": (
                    "is_public_domain",
                    "youtube_trailer_url",
                ),
                "description": "Enable public domain for full streaming OR use YouTube trailer for popular movies",
            },
        ),
        (
            "Media Files (Upload Only for Public Domain)",
            {
                "fields": (
                    "video_file",
                    "thumbnail",
                    "trailer_url",
                ),
                "description": "Upload main video only if it is public domain content",
            },
        ),
        (
            "Tags & Categorization",
            {
                "fields": ("tags",),
                "description": "Tags are auto-generated but can be manually edited",
            },
        ),
        ("Additional Info", {"fields": ("duration", "view_count")}),
    )

    def get_inlines(self, request, obj):
        if obj and obj.content_type == "SERIES":
            return [EpisodeInline]
        return []
    
    def save_model(self, request, obj, form, change):
        """Auto-generate tags when saving content"""
        super().save_model(request, obj, form, change)
        # Generate tags if none exist
        if not obj.tags.exists():
            AutoTagger.apply_tags_to_content(obj)
    
    def generate_tags_action(self, request, queryset):
        """Admin action to generate tags for selected content"""
        count = 0
        for content in queryset:
            AutoTagger.apply_tags_to_content(content)
            count += 1
        self.message_user(request, f"Generated tags for {count} content items")
    generate_tags_action.short_description = "Generate tags for selected content"
    
    def approve_content(self, request, queryset):
        """Admin action to approve selected content"""
        updated = queryset.update(approval_status='APPROVED')
        self.message_user(request, f"✅ Approved {updated} content items", level='SUCCESS')
    approve_content.short_description = "✅ Approve selected content"
    
    def reject_content(self, request, queryset):
        """Admin action to reject selected content"""
        updated = queryset.update(approval_status='REJECTED')
        self.message_user(request, f"❌ Rejected {updated} content items", level='WARNING')
    reject_content.short_description = "❌ Reject selected content"
    
    def mark_as_coming_soon(self, request, queryset):
        """Admin action to mark content as coming soon"""
        updated = queryset.update(is_coming_soon=True)
        self.message_user(request, f"Marked {updated} content items as coming soon")
    mark_as_coming_soon.short_description = "Mark as Coming Soon"


@admin.register(Episode)
class EpisodeAdmin(admin.ModelAdmin):
    list_display = ["series", "season_number", "episode_number", "title", "duration"]
    list_filter = ["series", "season_number"]
    search_fields = ["title", "series__title"]
    ordering = ["series", "season_number", "episode_number"]

    fieldsets = (
        (
            "Episode Information",
            {
                "fields": (
                    "series",
                    "season_number",
                    "episode_number",
                    "title",
                    "description",
                )
            },
        ),
        (
            "Media Files",
            {
                "fields": ("video_file", "thumbnail"),
                "description": "Upload episode video and thumbnail image",
            },
        ),
        ("Additional Info", {"fields": ("duration",)}),
    )


@admin.register(Music)
class MusicAdmin(admin.ModelAdmin):
    list_display = ["title", "artist", "album", "genre", "release_date", "duration"]
    list_filter = ["genre", "release_date", "artist"]
    search_fields = ["title", "artist", "album"]
    ordering = ["-created_at"]

    fieldsets = (
        (
            "Music Information",
            {"fields": ("title", "artist", "album", "genre", "release_date")},
        ),
        (
            "Media Files",
            {
                "fields": ("audio_file", "thumbnail"),
                "description": "Upload audio file and album cover/thumbnail",
            },
        ),
        ("Additional Info", {"fields": ("duration", "play_count")}),
    )


@admin.register(VideoWatchHistory)
class VideoWatchHistoryAdmin(admin.ModelAdmin):
    model = VideoWatchHistory


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
