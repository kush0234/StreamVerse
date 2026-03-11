from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import VideoContent, Music
from .services.recommendation_engine import RecommendationEngine
from .serializers import (
    RecommendationVideoSerializer, RecommendationMusicSerializer,
    ContinueWatchingSerializer, HomeRecommendationsSerializer
)
from apps.users.models import Profile


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def home_recommendations(request):
    """
    Get comprehensive home page recommendations
    """
    profile_id = request.query_params.get('profile')
    if not profile_id:
        return Response(
            {'error': 'Profile ID is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    profile = get_object_or_404(Profile, id=profile_id, user=request.user)
    engine = RecommendationEngine()
    
    # Get all recommendation types
    continue_watching = engine.get_continue_watching(request.user, profile, limit=10)
    trending_videos = engine.get_trending_videos(limit=15)
    top_video_picks = engine.get_top_video_picks(request.user, profile, limit=15)
    because_you_watched = engine.get_because_you_watched(request.user, profile, limit=15)
    trending_music = engine.get_trending_music(limit=15)
    top_music_picks = engine.get_top_music_picks(request.user, profile, limit=15)
    because_you_listened = engine.get_because_you_listened(request.user, profile, limit=15)
    
    # Serialize data
    data = {
        'continue_watching': ContinueWatchingSerializer(continue_watching, many=True).data,
        'trending_videos': RecommendationVideoSerializer(trending_videos, many=True, context={'request': request}).data,
        'top_video_picks': RecommendationVideoSerializer(top_video_picks, many=True, context={'request': request}).data,
        'because_you_watched': RecommendationVideoSerializer(because_you_watched, many=True, context={'request': request}).data,
        'trending_music': RecommendationMusicSerializer(trending_music, many=True, context={'request': request}).data,
        'top_music_picks': RecommendationMusicSerializer(top_music_picks, many=True, context={'request': request}).data,
        'because_you_listened': RecommendationMusicSerializer(because_you_listened, many=True, context={'request': request}).data,
    }
    
    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
def trending_videos(request):
    """
    Get trending videos
    """
    days = int(request.query_params.get('days', 7))
    limit = int(request.query_params.get('limit', 20))
    
    engine = RecommendationEngine()
    trending = engine.get_trending_videos(limit=limit, days=days)
    
    serializer = RecommendationVideoSerializer(trending, many=True, context={'request': request})
    return Response({
        'results': serializer.data,
        'count': len(serializer.data)
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def trending_music(request):
    """
    Get trending music
    """
    days = int(request.query_params.get('days', 7))
    limit = int(request.query_params.get('limit', 20))
    
    engine = RecommendationEngine()
    trending = engine.get_trending_music(limit=limit, days=days)
    
    serializer = RecommendationMusicSerializer(trending, many=True, context={'request': request})
    return Response({
        'results': serializer.data,
        'count': len(serializer.data)
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def top_video_picks(request):
    """
    Get personalized top video picks
    """
    profile_id = request.query_params.get('profile')
    if not profile_id:
        return Response(
            {'error': 'Profile ID is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    profile = get_object_or_404(Profile, id=profile_id, user=request.user)
    limit = int(request.query_params.get('limit', 20))
    
    engine = RecommendationEngine()
    top_picks = engine.get_top_video_picks(request.user, profile, limit=limit)
    
    serializer = RecommendationVideoSerializer(top_picks, many=True, context={'request': request})
    return Response({
        'results': serializer.data,
        'count': len(serializer.data)
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def top_music_picks(request):
    """
    Get personalized top music picks
    """
    profile_id = request.query_params.get('profile')
    if not profile_id:
        return Response(
            {'error': 'Profile ID is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    profile = get_object_or_404(Profile, id=profile_id, user=request.user)
    limit = int(request.query_params.get('limit', 20))
    
    engine = RecommendationEngine()
    top_picks = engine.get_top_music_picks(request.user, profile, limit=limit)
    
    serializer = RecommendationMusicSerializer(top_picks, many=True, context={'request': request})
    return Response({
        'results': serializer.data,
        'count': len(serializer.data)
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def continue_watching(request):
    """
    Get continue watching recommendations
    """
    profile_id = request.query_params.get('profile')
    if not profile_id:
        return Response(
            {'error': 'Profile ID is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    profile = get_object_or_404(Profile, id=profile_id, user=request.user)
    limit = int(request.query_params.get('limit', 10))
    
    engine = RecommendationEngine()
    continue_watching_data = engine.get_continue_watching(request.user, profile, limit=limit)
    
    serializer = ContinueWatchingSerializer(continue_watching_data, many=True)
    return Response({
        'results': serializer.data,
        'count': len(serializer.data)
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def similar_content(request, content_id):
    """
    Get similar content (users also liked)
    """
    content_type = request.query_params.get('type', 'video')  # video or music
    limit = int(request.query_params.get('limit', 15))
    
    if content_type not in ['video', 'music']:
        return Response(
            {'error': 'Content type must be "video" or "music"'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify content exists
    if content_type == 'video':
        get_object_or_404(VideoContent, id=content_id)
    else:
        get_object_or_404(Music, id=content_id)
    
    engine = RecommendationEngine()
    similar = engine.get_users_also_liked(content_id, content_type, limit=limit)
    
    if content_type == 'video':
        serializer = RecommendationVideoSerializer(similar, many=True, context={'request': request})
    else:
        serializer = RecommendationMusicSerializer(similar, many=True, context={'request': request})
    
    return Response({
        'results': serializer.data,
        'count': len(serializer.data),
        'content_type': content_type
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def record_interaction(request):
    """
    Record user interaction for recommendation system
    """
    profile_id = request.data.get('profile_id')
    interaction_type = request.data.get('interaction_type')
    video_id = request.data.get('video_id')
    music_id = request.data.get('music_id')
    episode_id = request.data.get('episode_id')
    duration = request.data.get('duration', 0)
    
    if not profile_id or not interaction_type:
        return Response(
            {'error': 'Profile ID and interaction type are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    profile = get_object_or_404(Profile, id=profile_id, user=request.user)
    
    # Validate content exists
    video = None
    music = None
    episode = None
    
    if video_id:
        video = get_object_or_404(VideoContent, id=video_id)
    if music_id:
        music = get_object_or_404(Music, id=music_id)
    if episode_id:
        from .models import Episode
        episode = get_object_or_404(Episode, id=episode_id)
    
    if not any([video, music, episode]):
        return Response(
            {'error': 'At least one content ID (video_id, music_id, or episode_id) is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    engine = RecommendationEngine()
    engine.record_interaction(
        user=request.user,
        profile=profile,
        interaction_type=interaction_type,
        video=video,
        music=music,
        episode=episode,
        duration=duration
    )
    
    return Response({
        'message': 'Interaction recorded successfully'
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_similarity_scores(request):
    """
    Update content similarity scores (admin only)
    """
    if not request.user.role in ['ADMIN', 'SUPERADMIN']:
        return Response(
            {'error': 'Admin access required'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    content_type = request.data.get('content_type', 'video')
    
    if content_type not in ['video', 'music']:
        return Response(
            {'error': 'Content type must be "video" or "music"'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    engine = RecommendationEngine()
    engine.update_similarity_scores(content_type=content_type)
    
    return Response({
        'message': f'Similarity scores updated for {content_type} content'
    }, status=status.HTTP_200_OK)