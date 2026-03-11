# StreamVerse Recommendation System Setup

## Overview

This document provides setup instructions for the hybrid recommendation system implemented for StreamVerse. The system combines rule-based filtering and collaborative filtering to provide personalized content recommendations for both video and music content.

## Files Created/Modified

### New Models (in `apps/content/models.py`)
- `UserInteraction`: Tracks user interactions with content
- `ContentSimilarity`: Stores similarity scores between content items  
- `MusicListenHistory`: Tracks music listening patterns

### New Services
- `apps/content/services/recommendation_engine.py`: Core recommendation logic
- `apps/content/services/__init__.py`: Services package

### New Views
- `apps/content/recommendation_views.py`: API endpoints for recommendations

### New Serializers (added to `apps/content/serializers.py`)
- `ContinueWatchingSerializer`
- `RecommendationVideoSerializer`
- `RecommendationMusicSerializer`
- `HomeRecommendationsSerializer`

### New URLs (added to `apps/content/urls.py`)
- `/api/content/recommendations/home/`
- `/api/content/recommendations/videos/trending/`
- `/api/content/recommendations/music/trending/`
- `/api/content/recommendations/videos/top-picks/`
- `/api/content/recommendations/music/top-picks/`
- `/api/content/recommendations/continue-watching/`
- `/api/content/recommendations/similar/<content_id>/`
- `/api/content/recommendations/record-interaction/`
- `/api/content/recommendations/update-similarity/`

### Database Migration
- `apps/content/migrations/0017_recommendation_models.py`: Creates new tables

### Management Commands
- `apps/content/management/commands/populate_recommendations.py`: Populate sample data

### Admin Interface (added to `apps/content/admin.py`)
- Admin interfaces for new models

### Documentation
- `RECOMMENDATION_API_EXAMPLES.md`: API usage examples
- `RECOMMENDATION_SETUP.md`: This setup guide
- `test_recommendations.py`: Test script

## Setup Instructions

### 1. Install Dependencies

The recommendation system uses only Django ORM and doesn't require additional ML libraries. Ensure you have the existing project dependencies:

```bash
pip install django djangorestframework
# ... other existing dependencies
```

### 2. Run Database Migration

Apply the new migration to create recommendation tables:

```bash
cd backend
python manage.py migrate content
```

### 3. Update Admin (Optional)

The admin interfaces are automatically registered. You can access them at `/admin/` after creating a superuser:

```bash
python manage.py createsuperuser
```

### 4. Populate Sample Data (Optional)

Generate sample interactions and similarity scores for testing:

```bash
python manage.py populate_recommendations --sample-interactions 100
```

### 5. Test the System

Run the test script to verify everything works:

```bash
python test_recommendations.py
```

### 6. Start the Server

```bash
python manage.py runserver
```

## API Usage

### Basic Authentication

All personalized endpoints require JWT authentication:

```bash
# Get JWT token first
curl -X POST http://localhost:8000/api/auth/login/ \
     -H "Content-Type: application/json" \
     -d '{"username": "your_username", "password": "your_password"}'

# Use token in subsequent requests
curl -H "Authorization: Bearer <your_jwt_token>" \
     "http://localhost:8000/api/content/recommendations/home/?profile=1"
```

### Home Page Recommendations

```bash
curl -H "Authorization: Bearer <token>" \
     "http://localhost:8000/api/content/recommendations/home/?profile=1"
```

### Record User Interactions

```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"profile_id": 1, "interaction_type": "LIKE", "video_id": 1}' \
     "http://localhost:8000/api/content/recommendations/record-interaction/"
```

## Integration with Existing Code

### Frontend Integration

Add interaction tracking to your video/music players:

```javascript
// When user starts playing video
fetch('/api/content/recommendations/record-interaction/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    profile_id: currentProfileId,
    interaction_type: 'PLAY',
    video_id: videoId,
    duration: 0
  })
});

// When user completes video
fetch('/api/content/recommendations/record-interaction/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    profile_id: currentProfileId,
    interaction_type: 'COMPLETE',
    video_id: videoId,
    duration: totalWatchTime
  })
});
```

### Update Existing Views

You may want to integrate interaction tracking into existing views:

```python
# In your existing video views
from apps.content.services.recommendation_engine import RecommendationEngine

def video_detail_view(request, video_id):
    # ... existing code ...
    
    # Record view interaction
    if request.user.is_authenticated:
        profile = request.user.profiles.first()  # or get from request
        engine = RecommendationEngine()
        engine.record_interaction(
            user=request.user,
            profile=profile,
            interaction_type='VIEW',
            video=video
        )
    
    # ... rest of view ...
```

## Performance Optimization

### 1. Database Indexing

The migration includes proper indexes for performance. Monitor query performance and add additional indexes if needed.

### 2. Caching

Consider adding Redis caching for frequently accessed recommendations:

```python
from django.core.cache import cache

def get_trending_videos_cached(limit=20, days=7):
    cache_key = f"trending_videos_{limit}_{days}"
    result = cache.get(cache_key)
    
    if result is None:
        engine = RecommendationEngine()
        result = engine.get_trending_videos(limit=limit, days=days)
        cache.set(cache_key, result, timeout=3600)  # Cache for 1 hour
    
    return result
```

### 3. Background Tasks

For production, consider using Celery for heavy operations:

```python
# tasks.py
from celery import shared_task

@shared_task
def update_similarity_scores_task(content_type='video'):
    engine = RecommendationEngine()
    engine.update_similarity_scores(content_type=content_type)
```

### 4. Pagination

For large datasets, implement pagination:

```python
from django.core.paginator import Paginator

def paginated_recommendations(request, queryset):
    paginator = Paginator(queryset, 20)  # 20 items per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    return page_obj
```

## Monitoring and Analytics

### 1. Track Recommendation Performance

Monitor which recommendations users actually interact with:

```python
# Add to your analytics
def track_recommendation_click(user, profile, content_id, recommendation_type):
    UserInteraction.objects.create(
        user=user,
        profile=profile,
        video_id=content_id,  # or music_id
        interaction_type='VIEW',
        interaction_value=2.0,  # Higher value for recommended content
        session_id=f"rec_{recommendation_type}"
    )
```

### 2. A/B Testing

Test different recommendation algorithms:

```python
def get_recommendations_with_ab_test(user, profile):
    # Simple A/B test based on user ID
    if user.id % 2 == 0:
        # Algorithm A: More collaborative filtering
        return engine.get_collaborative_recommendations(user, profile)
    else:
        # Algorithm B: More content-based
        return engine.get_content_based_recommendations(user, profile)
```

## Troubleshooting

### Common Issues

1. **Migration Errors**: Ensure all dependencies are installed and previous migrations are applied
2. **Performance Issues**: Check database indexes and consider caching
3. **Empty Recommendations**: Ensure users have interaction history or fallback to trending content
4. **Authentication Errors**: Verify JWT token is valid and user has required permissions

### Debug Mode

Enable debug logging for the recommendation engine:

```python
import logging

logger = logging.getLogger(__name__)

class RecommendationEngine:
    def get_top_video_picks(self, user, profile, limit=20):
        logger.debug(f"Getting top picks for user {user.id}, profile {profile.id}")
        # ... existing code ...
        logger.debug(f"Found {len(top_picks)} recommendations")
        return top_picks
```

## Future Enhancements

### 1. Machine Learning Integration

Consider adding scikit-learn for more advanced algorithms:

```python
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

def calculate_content_similarity_ml(self, content_a, content_b):
    # Use TF-IDF on descriptions + genres
    texts = [
        f"{content_a.description} {content_a.genre}",
        f"{content_b.description} {content_b.genre}"
    ]
    
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(texts)
    similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
    
    return similarity
```

### 2. Real-time Recommendations

Implement WebSocket-based real-time recommendations:

```python
# consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class RecommendationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        # Generate real-time recommendations
        recommendations = await self.get_recommendations(data['user_id'])
        await self.send(text_data=json.dumps(recommendations))
```

### 3. Advanced Analytics

Add detailed analytics dashboard:

```python
def get_recommendation_analytics(date_range):
    return {
        'total_interactions': UserInteraction.objects.filter(
            created_at__range=date_range
        ).count(),
        'top_recommended_content': # ... complex query,
        'user_engagement_metrics': # ... analytics,
    }
```

This recommendation system provides a solid foundation that can be extended based on your specific needs and user feedback.