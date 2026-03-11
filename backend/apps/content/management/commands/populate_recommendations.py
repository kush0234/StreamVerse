from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.content.services.recommendation_engine import RecommendationEngine
from apps.content.models import VideoContent, Music, UserInteraction, MusicListenHistory
from apps.users.models import User, Profile
import random


class Command(BaseCommand):
    help = 'Populate recommendation system with sample data and similarity scores'

    def add_arguments(self, parser):
        parser.add_argument(
            '--similarity-only',
            action='store_true',
            help='Only update similarity scores, skip sample data generation',
        )
        parser.add_argument(
            '--sample-interactions',
            type=int,
            default=100,
            help='Number of sample interactions to generate (default: 100)',
        )

    def handle(self, *args, **options):
        engine = RecommendationEngine()
        
        if not options['similarity_only']:
            self.stdout.write('Generating sample user interactions...')
            self.generate_sample_interactions(options['sample_interactions'])
        
        self.stdout.write('Updating video similarity scores...')
        engine.update_similarity_scores(content_type='video')
        
        self.stdout.write('Updating music similarity scores...')
        engine.update_similarity_scores(content_type='music')
        
        self.stdout.write(
            self.style.SUCCESS('Successfully populated recommendation system!')
        )

    def generate_sample_interactions(self, count):
        """Generate sample user interactions for testing"""
        users = list(User.objects.filter(role='USER'))
        videos = list(VideoContent.objects.filter(approval_status='APPROVED'))
        music = list(Music.objects.all())
        
        if not users or (not videos and not music):
            self.stdout.write(
                self.style.WARNING('No users or content found. Skipping sample data generation.')
            )
            return
        
        interaction_types = ['VIEW', 'LIKE', 'PLAY', 'COMPLETE', 'WATCHLIST_ADD']
        
        for _ in range(count):
            user = random.choice(users)
            profile = user.profiles.first()
            
            if not profile:
                continue
            
            interaction_type = random.choice(interaction_types)
            
            # Randomly choose between video and music
            if videos and music:
                content_type = random.choice(['video', 'music'])
            elif videos:
                content_type = 'video'
            elif music:
                content_type = 'music'
            else:
                continue
            
            if content_type == 'video':
                video = random.choice(videos)
                UserInteraction.objects.create(
                    user=user,
                    profile=profile,
                    video=video,
                    interaction_type=interaction_type,
                    interaction_value=RecommendationEngine().interaction_weights.get(interaction_type, 1.0),
                    duration=random.randint(0, 3600),
                    created_at=timezone.now() - timezone.timedelta(
                        days=random.randint(0, 30)
                    )
                )
                
                # Also create watch history for some interactions
                if interaction_type in ['VIEW', 'COMPLETE'] and random.random() < 0.7:
                    from apps.content.models import VideoWatchHistory
                    duration_watched = random.randint(0, video.duration or 3600)
                    VideoWatchHistory.objects.get_or_create(
                        user=user,
                        profile=profile,
                        video=video,
                        defaults={
                            'duration_watched': duration_watched,
                            'completed': interaction_type == 'COMPLETE' or duration_watched >= (video.duration or 3600) * 0.9
                        }
                    )
            
            else:  # music
                music_item = random.choice(music)
                UserInteraction.objects.create(
                    user=user,
                    profile=profile,
                    music=music_item,
                    interaction_type=interaction_type,
                    interaction_value=RecommendationEngine().interaction_weights.get(interaction_type, 1.0),
                    duration=random.randint(0, music_item.duration or 300),
                    created_at=timezone.now() - timezone.timedelta(
                        days=random.randint(0, 30)
                    )
                )
                
                # Also create listen history for some interactions
                if interaction_type in ['PLAY', 'COMPLETE'] and random.random() < 0.7:
                    duration_listened = random.randint(0, music_item.duration or 300)
                    MusicListenHistory.objects.get_or_create(
                        user=user,
                        profile=profile,
                        music=music_item,
                        defaults={
                            'duration_listened': duration_listened,
                            'completed': interaction_type == 'COMPLETE' or duration_listened >= (music_item.duration or 300) * 0.9,
                            'play_count': random.randint(1, 5)
                        }
                    )
        
        self.stdout.write(f'Generated {count} sample interactions')