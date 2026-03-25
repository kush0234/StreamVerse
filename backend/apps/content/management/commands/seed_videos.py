import json
import os
import cloudinary.uploader
from django.core.management.base import BaseCommand
from apps.content.models import VideoContent, Episode


def upload_thumbnail(local_path=None, url=None, label="thumbnail"):
    """
    Upload a thumbnail to Cloudinary.
    Prefers a local file (already downloaded) over a remote URL.
    Returns Cloudinary public_id or None.
    """
    source = local_path if local_path and os.path.exists(local_path) else url
    if not source:
        return None
    try:
        result = cloudinary.uploader.upload(
            source,
            folder="thumbnails",
            resource_type="image",
        )
        return result["public_id"]
    except Exception as e:
        print(f"    ⚠️  Failed to upload {label} thumbnail: {e}")
        return None


class Command(BaseCommand):
    help = "Seed video content and episodes from videos.json"

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            default=os.path.join(os.path.dirname(__file__), "../../../../../videos.json"),
            help="Path to videos.json (default: project root)",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing VideoContent and Episode records before seeding",
        )
        parser.add_argument(
            "--episodes-only",
            action="store_true",
            help="Only seed episodes for existing series (skip creating videos)",
        )

    def handle(self, *args, **options):
        json_path = os.path.abspath(options["file"])

        if not os.path.exists(json_path):
            self.stdout.write(self.style.ERROR(f"File not found: {json_path}"))
            return

        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if options["clear"] and not options["episodes_only"]:
            Episode.objects.all().delete()
            VideoContent.objects.all().delete()
            self.stdout.write(self.style.WARNING("Cleared existing content."))

        created_videos = 0
        created_episodes = 0
        skipped_videos = 0
        skipped_episodes = 0

        sections = {
            "trailer_only": {"is_coming_soon": False},
            "coming_soon": {"is_coming_soon": True},
        }

        for section_key, defaults in sections.items():
            for item in data.get(section_key, []):
                episodes_data = item.pop("episodes", [])
                thumbnail_url = item.pop("thumbnail_url", None)

                if options["episodes_only"]:
                    # Just look up the existing series — don't create
                    try:
                        video = VideoContent.objects.get(
                            title=item["title"],
                            content_type=item["content_type"],
                        )
                    except VideoContent.DoesNotExist:
                        self.stdout.write(
                            self.style.WARNING(f"  ⏭  Series not found, skipping: {item['title']}")
                        )
                        continue
                else:
                    # Upload thumbnail to Cloudinary
                    cloudinary_thumbnail = upload_thumbnail(
                        local_path=item.pop("thumbnail_local", None),
                        url=thumbnail_url,
                        label=item["title"],
                    )

                    video, created = VideoContent.objects.get_or_create(
                        title=item["title"],
                        content_type=item["content_type"],
                        defaults={
                            **item,
                            **defaults,
                            "approval_status": "APPROVED",
                            **({"thumbnail": cloudinary_thumbnail} if cloudinary_thumbnail else {}),
                        },
                    )

                    if created:
                        created_videos += 1
                        self.stdout.write(f"  ✅ Created: {video.title} ({video.content_type})")
                    else:
                        skipped_videos += 1
                        self.stdout.write(f"  ⏭  Skipped (exists): {video.title}")

                # Seed episodes — only for SERIES
                if video.content_type != "SERIES" or not episodes_data:
                    continue

                self.stdout.write(f"  📺 Seeding episodes for: {video.title}")

                for ep in episodes_data:
                    ep_thumbnail_url = ep.pop("thumbnail_url", None)
                    ep_thumbnail_local = ep.pop("thumbnail_local", None)
                    ep.pop("youtube_trailer_url", None)  # episodes don't store this

                    _, ep_created = Episode.objects.get_or_create(
                        series=video,
                        season_number=ep["season_number"],
                        episode_number=ep["episode_number"],
                        defaults={
                            "title": ep["title"],
                            "description": ep.get("description", ""),
                            "duration": ep.get("duration"),
                            "approval_status": "APPROVED",
                        },
                    )

                    if ep_created:
                        # Upload episode thumbnail — prefer local file, fall back to URL
                        ep_label = f"S{ep['season_number']}E{ep['episode_number']} - {ep['title']}"
                        cloudinary_ep_thumbnail = upload_thumbnail(
                            local_path=ep_thumbnail_local,
                            url=ep_thumbnail_url,
                            label=ep_label,
                        )
                        if cloudinary_ep_thumbnail:
                            _.thumbnail = cloudinary_ep_thumbnail
                            _.save(update_fields=["thumbnail"])

                        created_episodes += 1
                        self.stdout.write(
                            f"    🎬 S{ep['season_number']}E{ep['episode_number']}: {ep['title']}"
                        )
                    else:
                        skipped_episodes += 1
                        self.stdout.write(
                            f"    ⏭  Skipped (exists): S{ep['season_number']}E{ep['episode_number']}: {ep['title']}"
                        )

        if options["episodes_only"]:
            self.stdout.write(
                self.style.SUCCESS(
                    f"\nDone. {created_episodes} episodes created, {skipped_episodes} skipped."
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"\nDone. {created_videos} videos created, {created_episodes} episodes created, "
                    f"{skipped_videos} videos skipped, {skipped_episodes} episodes skipped."
                )
            )
