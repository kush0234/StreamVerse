from django.core.management.base import BaseCommand
from apps.content.models import VideoContent, Music, ContentSimilarity
from apps.content.services.recommendation_engine import RecommendationEngine


class Command(BaseCommand):
    help = "Populate ContentSimilarity table with computed similarity scores"

    def add_arguments(self, parser):
        parser.add_argument(
            "--type",
            choices=["video", "music", "both"],
            default="both",
            help="Content type to compute similarities for (default: both)",
        )
        parser.add_argument(
            "--min-score",
            type=float,
            default=0.1,
            help="Minimum similarity score to store (default: 0.1)",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing similarity data before seeding",
        )

    def handle(self, *args, **options):
        content_type = options["type"]
        min_score = options["min_score"]
        engine = RecommendationEngine()

        if options["clear"]:
            self.stdout.write("Clearing existing similarity data...")
            if content_type in ("video", "both"):
                deleted, _ = ContentSimilarity.objects.filter(video_a__isnull=False).delete()
                self.stdout.write("  Deleted {} video similarity records".format(deleted))
            if content_type in ("music", "both"):
                deleted, _ = ContentSimilarity.objects.filter(music_a__isnull=False).delete()
                self.stdout.write("  Deleted {} music similarity records".format(deleted))

        if content_type in ("video", "both"):
            self._seed_video_similarities(engine, min_score)

        if content_type in ("music", "both"):
            self._seed_music_similarities(engine, min_score)

        self.stdout.write(self.style.SUCCESS("Done."))

    def _seed_video_similarities(self, engine, min_score):
        videos = list(VideoContent.objects.filter(approval_status="APPROVED").prefetch_related("tags"))
        total = len(videos)

        if total < 2:
            self.stdout.write(self.style.WARNING("Not enough approved videos ({}) to compute similarities.".format(total)))
            return

        self.stdout.write("Computing similarities for {} videos...".format(total))
        pairs = total * (total - 1) // 2
        created = updated = skipped = 0

        for i, video_a in enumerate(videos):
            for video_b in videos[i + 1:]:
                score = engine._calculate_video_similarity(video_a, video_b)
                if score < min_score:
                    skipped += 1
                    continue

                _, was_created = ContentSimilarity.objects.update_or_create(
                    video_a=video_a,
                    video_b=video_b,
                    similarity_type="HYBRID",
                    defaults={"similarity_score": score},
                )
                if was_created:
                    created += 1
                else:
                    updated += 1

        self.stdout.write(
            "  Videos -- {} pairs | {} created | {} updated | {} below threshold".format(
                pairs, created, updated, skipped
            )
        )

    def _seed_music_similarities(self, engine, min_score):
        tracks = list(Music.objects.all())
        total = len(tracks)

        if total < 2:
            self.stdout.write(self.style.WARNING("Not enough music tracks ({}) to compute similarities.".format(total)))
            return

        self.stdout.write("Computing similarities for {} music tracks...".format(total))
        pairs = total * (total - 1) // 2
        created = updated = skipped = 0

        for i, music_a in enumerate(tracks):
            for music_b in tracks[i + 1:]:
                score = engine._calculate_music_similarity(music_a, music_b)
                if score < min_score:
                    skipped += 1
                    continue

                _, was_created = ContentSimilarity.objects.update_or_create(
                    music_a=music_a,
                    music_b=music_b,
                    similarity_type="HYBRID",
                    defaults={"similarity_score": score},
                )
                if was_created:
                    created += 1
                else:
                    updated += 1

        self.stdout.write(
            "  Music  -- {} pairs | {} created | {} updated | {} below threshold".format(
                pairs, created, updated, skipped
            )
        )
