#!/usr/bin/env python
"""
Simple test script to demonstrate the recommendation system functionality.
Run this after setting up the database and creating some sample data.

Usage:
    python test_recommendations.py
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'streamverse.settings')
django.setup()

from apps.content.services.recommendation_engine import RecommendationEngine
from apps.content.models import VideoContent, Music, UserInteraction, WatchHistory
from apps.users.models import User, Profile
from django.utils import timezone
import random


def create_sample_data():
    """Create sample users and content for testing"""
    print("Creating sample data...")

    # Create test user
    user, created = User.objects.get_or_create(
        username='testuser',
        defaults={
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User'
        }
    )

    if created:
        user.set_password('testpass123')
        user.save()

    # Create profile
    profile, created = Profile.objects.get_or_create(
        user=user,
        name='Test Profile',
        defaults={'age_restriction': False}
    )

    # Create sample videos if they don't exist
    sample_videos = [
        {
            'title': 'The Matrix',
            'description': 'A computer programmer discovers reality is a simulation.',
            'genre': 'Sci-Fi',
            'content_type': 'MOVIE',
            'duration': 8100,
            'rating': 8.7
        },
        {
            'title': 'Inception',
            'description': 'A thief enters dreams to plant ideas.',
            'genre': 'Sci-Fi',
            'content_type': 'MOVIE',
            'duration': 8880,
            'rating': 8.8
        },
        {
            'title': 'Breaking Bad',
            'description': 'A chemistry teacher turns to cooking meth.',
            'genre': 'Drama',
            'content_type': 'SERIES',
            'duration': 2700,
            'rating': 9.5
        }
    ]

    for video_data in sample_videos:
        video, created = VideoContent.objects.get_or_create(
            title=video_data['title'],
            defaults={
                **video_data,
                'release_date': timezone.now().date(),
                'approval_status': 'APPROVED'
            }
        )
        if created:
            print(f"Created video: {video.title}")

    # Create sample music
    sample_music = [
        {
            'title': 'Bohemian Rhapsody',
            'artist': 'Queen',
            'album': 'A Night at the Opera',
            'genre': 'Rock',
            'duration': 355
        },
        {
            'title': 'Hotel California',
            'artist': 'Eagles',
            'album': 'Hotel California',
            'genre': 'Rock',
            'duration': 391
        },
        {
            'title': 'Billie Jean',
            'artist': 'Michael Jackson',
            'album': 'Thriller',
            'genre': 'Pop',
            'duration': 294
        }
    ]

    for music_data in sample_music:
        music, created = Music.objects.get_or_create(
            title=music_data['title'],
            artist=music_data['artist'],
            defaults={
                **music_data,
                'release_date': timezone.now().date()
            }
        )
        if created:
            print(f"Created music: {music.title} by {music.artist}")

    return user, profile


def create_sample_interactions(user, profile):
    """Create sample user interactions"""
    print("Creating sample interactions...")

    engine = RecommendationEngine()
    videos = VideoContent.objects.filter(approval_status='APPROVED')
    music = Music.objects.all()

    # Create video interactions
    for video in videos[:2]:  # Interact with first 2 videos
        engine.record_interaction(
            user=user,
            profile=profile,
            interaction_type='VIEW',
            video=video,
            duration=random.randint(300, 1800)
        )

        engine.record_interaction(
            user=user,
            profile=profile,
            interaction_type='LIKE',
            video=video
        )

    # Create music interactions
    for music_item in music[:2]:  # Interact with first 2 songs
        engine.record_interaction(
            user=user,
            profile=profile,
            interaction_type='PLAY',
            music=music_item,
            duration=music_item.duration
        )

        # Create listen history
        WatchHistory.objects.get_or_create(
            user=user,
            profile=profile,
            music=music_item,
            content_type='MUSIC',
            defaults={
                'duration_watched': music_item.duration,
                'completed': True,
                'play_count': random.randint(1, 5)
            }
        )

    print(f"Created interactions for user: {user.username}")


def test_recommendations(user, profile):
    """Test all recommendation methods"""
    print(f"\n=== Testing Recommendations for {user.username} ===")

    engine = RecommendationEngine()

    # Test continue watching
    print("\n1. Continue Watching:")
    continue_watching = engine.get_continue_watching(user, profile, limit=5)
    for item in continue_watching:
        content = item['content']
        print(f"   - {content.title} ({item['progress_percentage']:.1f}% watched)")

    # Test trending videos
    print("\n2. Trending Videos:")
    trending_videos = engine.get_trending_videos(limit=5)
    for video in trending_videos:
        print(f"   - {video.title} (Views: {video.view_count})")

    # Test trending music
    print("\n3. Trending Music:")
    trending_music = engine.get_trending_music(limit=5)
    for music in trending_music:
        print(f"   - {music.title} by {music.artist} (Plays: {music.play_count})")

    # Test because you watched
    print("\n4. Because You Watched:")
    because_watched = engine.get_because_you_watched(user, profile, limit=5)
    for video in because_watched:
        print(f"   - {video.title} ({video.genre})")

    # Test because you listened
    print("\n5. Because You Listened:")
    because_listened = engine.get_because_you_listened(user, profile, limit=5)
    for music in because_listened:
        print(f"   - {music.title} by {music.artist} ({music.genre})")

    # Test top picks
    print("\n6. Top Video Picks:")
    top_video_picks = engine.get_top_video_picks(user, profile, limit=5)
    for video in top_video_picks:
        print(f"   - {video.title} (Rating: {video.rating})")

    print("\n7. Top Music Picks:")
    top_music_picks = engine.get_top_music_picks(user, profile, limit=5)
    for music in top_music_picks:
        print(f"   - {music.title} by {music.artist}")

    # Test users also liked
    if VideoContent.objects.exists():
        video = VideoContent.objects.first()
        print(f"\n8. Users Also Liked (for '{video.title}'):")
        also_liked = engine.get_users_also_liked(video.id, 'video', limit=3)
        for video in also_liked:
            print(f"   - {video.title}")


def test_similarity_calculation():
    """Test similarity calculation"""
    print("\n=== Testing Similarity Calculation ===")

    engine = RecommendationEngine()
    videos = VideoContent.objects.filter(approval_status='APPROVED')[:2]

    if len(videos) >= 2:
        video_a, video_b = videos[0], videos[1]
        similarity = engine.calculate_content_similarity(video_a, video_b, 'video')
        print(f"Similarity between '{video_a.title}' and '{video_b.title}': {similarity:.3f}")

    music = Music.objects.all()[:2]
    if len(music) >= 2:
        music_a, music_b = music[0], music[1]
        similarity = engine.calculate_content_similarity(music_a, music_b, 'music')
        print(f"Similarity between '{music_a.title}' and '{music_b.title}': {similarity:.3f}")


def main():
    """Main test function"""
    print("StreamVerse Recommendation System Test")
    print("=" * 40)

    try:
        # Create sample data
        user, profile = create_sample_data()

        # Create sample interactions
        create_sample_interactions(user, profile)

        # Test recommendations
        test_recommendations(user, profile)

        # Test similarity calculation
        test_similarity_calculation()

        print("\n" + "=" * 40)
        print("✅ All tests completed successfully!")
        print("\nTo test the API endpoints, you can now:")
        print("1. Start the Django server: python manage.py runserver")
        print("2. Create a superuser: python manage.py createsuperuser")
        print("3. Test the API endpoints using the examples in RECOMMENDATION_API_EXAMPLES.md")

    except Exception as e:
        print(f"\n❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
