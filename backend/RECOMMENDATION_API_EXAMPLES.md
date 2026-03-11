# StreamVerse Recommendation System API

## Overview

The StreamVerse recommendation system provides personalized content recommendations using a hybrid approach combining rule-based filtering and collaborative filtering. The system works for both video content (movies/series) and music.

## API Endpoints

### 1. Home Recommendations
Get comprehensive recommendations for the home page.

**Endpoint:** `GET /api/content/recommendations/home/`

**Parameters:**
- `profile` (required): Profile ID

**Example Request:**
```bash
curl -H "Authorization: Bearer <token>" \
     "http://localhost:8000/api/content/recommendations/home/?profile=1"
```

**Example Response:**
```json
{
  "continue_watching": [
    {
      "content": {
        "id": 1,
        "title": "The Matrix",
        "content_type": "MOVIE",
        "duration": 8100,
        "thumbnail": "https://res.cloudinary.com/..."
      },
      "content_type": "video",
      "progress_percentage": 45.2,
      "duration_watched": 3663,
      "last_watched": "2024-03-10T15:30:00Z"
    }
  ],
  "trending_videos": [
    {
      "id": 2,
      "title": "Inception",
      "description": "A mind-bending thriller...",
      "genre": "Sci-Fi",
      "release_date": "2010-07-16",
      "rating": 8.8,
      "content_type": "MOVIE",
      "thumbnail": "https://res.cloudinary.com/...",
      "duration": 8880,
      "view_count": 15420,
      "episode_count": 0,
      "tags": [
        {
          "id": 1,
          "name": "Mind-bending",
          "category": "THEME"
        }
      ]
    }
  ],
  "top_video_picks": [...],
  "because_you_watched": [...],
  "trending_music": [
    {
      "id": 1,
      "title": "Bohemian Rhapsody",
      "artist": "Queen",
      "album": "A Night at the Opera",
      "genre": "Rock",
      "release_date": "1975-10-31",
      "thumbnail": "https://res.cloudinary.com/...",
      "duration": 355,
      "duration_formatted": "5:55",
      "play_count": 8420
    }
  ],
  "top_music_picks": [...],
  "because_you_listened": [...]
}
```

### 2. Trending Videos
Get currently trending videos.

**Endpoint:** `GET /api/content/recommendations/videos/trending/`

**Parameters:**
- `days` (optional): Number of days to consider for trending (default: 7)
- `limit` (optional): Number of results (default: 20)

**Example Request:**
```bash
curl "http://localhost:8000/api/content/recommendations/videos/trending/?days=14&limit=10"
```

### 3. Trending Music
Get currently trending music.

**Endpoint:** `GET /api/content/recommendations/music/trending/`

**Parameters:**
- `days` (optional): Number of days to consider for trending (default: 7)
- `limit` (optional): Number of results (default: 20)

### 4. Top Video Picks
Get personalized video recommendations.

**Endpoint:** `GET /api/content/recommendations/videos/top-picks/`

**Parameters:**
- `profile` (required): Profile ID
- `limit` (optional): Number of results (default: 20)

**Example Request:**
```bash
curl -H "Authorization: Bearer <token>" \
     "http://localhost:8000/api/content/recommendations/videos/top-picks/?profile=1&limit=15"
```

### 5. Top Music Picks
Get personalized music recommendations.

**Endpoint:** `GET /api/content/recommendations/music/top-picks/`

**Parameters:**
- `profile` (required): Profile ID
- `limit` (optional): Number of results (default: 20)

### 6. Continue Watching
Get videos/episodes the user can continue watching.

**Endpoint:** `GET /api/content/recommendations/continue-watching/`

**Parameters:**
- `profile` (required): Profile ID
- `limit` (optional): Number of results (default: 10)

### 7. Similar Content (Users Also Liked)
Get content similar to a specific item.

**Endpoint:** `GET /api/content/recommendations/similar/<content_id>/`

**Parameters:**
- `type` (required): Content type ("video" or "music")
- `limit` (optional): Number of results (default: 15)

**Example Request:**
```bash
curl "http://localhost:8000/api/content/recommendations/similar/1/?type=video&limit=10"
```

### 8. Record User Interaction
Track user interactions for improving recommendations.

**Endpoint:** `POST /api/content/recommendations/record-interaction/`

**Request Body:**
```json
{
  "profile_id": 1,
  "interaction_type": "LIKE",
  "video_id": 5,
  "duration": 120
}
```

**Interaction Types:**
- `VIEW`: User viewed content
- `LIKE`: User liked content
- `DISLIKE`: User disliked content
- `SHARE`: User shared content
- `WATCHLIST_ADD`: Added to watchlist
- `WATCHLIST_REMOVE`: Removed from watchlist
- `PLAY`: Started playing
- `PAUSE`: Paused content
- `SKIP`: Skipped content
- `COMPLETE`: Completed watching/listening

**Example Request:**
```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"profile_id": 1, "interaction_type": "COMPLETE", "video_id": 3, "duration": 7200}' \
     "http://localhost:8000/api/content/recommendations/record-interaction/"
```

### 9. Update Similarity Scores (Admin Only)
Recalculate content similarity scores.

**Endpoint:** `POST /api/content/recommendations/update-similarity/`

**Request Body:**
```json
{
  "content_type": "video"
}
```

## Recommendation Logic

### Rule-Based Filtering
1. **Genre Similarity**: Content with matching genres gets higher scores
2. **Tag Similarity**: Content with similar tags is recommended
3. **Popularity**: View count and play count influence recommendations
4. **Recency**: Recently released content gets a boost
5. **User Preferences**: Based on user's watch/listen history

### Collaborative Filtering
1. **User-Based**: Find users with similar preferences
2. **Item-Based**: Find content liked by users who liked similar items
3. **Interaction Weighting**: Different interactions have different weights:
   - COMPLETE: 4.0
   - LIKE: 3.0
   - SHARE: 2.5
   - WATCHLIST_ADD: 2.0
   - PLAY: 1.5
   - VIEW: 1.0
   - SKIP: -0.5
   - WATCHLIST_REMOVE: -1.0
   - DISLIKE: -2.0

### Hybrid Approach
The system combines both approaches:
- **Content-Based Score** (60%): Genre + Tag + Popularity matching
- **Collaborative Score** (40%): User behavior similarity

## Database Models

### UserInteraction
Tracks all user interactions with content for recommendation learning.

### ContentSimilarity
Stores precomputed similarity scores between content items.

### MusicListenHistory
Tracks music listening patterns similar to VideoWatchHistory.

## Management Commands

### Populate Sample Data
```bash
python manage.py populate_recommendations --sample-interactions 500
```

### Update Similarity Scores Only
```bash
python manage.py populate_recommendations --similarity-only
```

## Integration Examples

### Frontend Integration
```javascript
// Get home recommendations
const getHomeRecommendations = async (profileId) => {
  const response = await fetch(`/api/content/recommendations/home/?profile=${profileId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Record user interaction
const recordInteraction = async (profileId, interactionType, contentId, contentType) => {
  const payload = {
    profile_id: profileId,
    interaction_type: interactionType,
    duration: 0
  };
  
  if (contentType === 'video') {
    payload.video_id = contentId;
  } else {
    payload.music_id = contentId;
  }
  
  await fetch('/api/content/recommendations/record-interaction/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
};

// Usage in video player
videoPlayer.on('play', () => {
  recordInteraction(profileId, 'PLAY', videoId, 'video');
});

videoPlayer.on('ended', () => {
  recordInteraction(profileId, 'COMPLETE', videoId, 'video');
});
```

### Mobile App Integration
```dart
// Flutter/Dart example
class RecommendationService {
  static const String baseUrl = 'http://localhost:8000/api/content/recommendations';
  
  static Future<Map<String, dynamic>> getHomeRecommendations(int profileId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/home/?profile=$profileId'),
      headers: {'Authorization': 'Bearer $token'},
    );
    return json.decode(response.body);
  }
  
  static Future<void> recordInteraction({
    required int profileId,
    required String interactionType,
    int? videoId,
    int? musicId,
    int duration = 0,
  }) async {
    final payload = {
      'profile_id': profileId,
      'interaction_type': interactionType,
      'duration': duration,
    };
    
    if (videoId != null) payload['video_id'] = videoId;
    if (musicId != null) payload['music_id'] = musicId;
    
    await http.post(
      Uri.parse('$baseUrl/record-interaction/'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode(payload),
    );
  }
}
```

## Performance Considerations

1. **Caching**: Implement Redis caching for frequently accessed recommendations
2. **Batch Processing**: Update similarity scores in background tasks
3. **Pagination**: Use pagination for large result sets
4. **Database Indexing**: Proper indexes are included in the migration
5. **Async Processing**: Consider Celery for heavy recommendation calculations

## Testing

### Sample API Calls
```bash
# Test trending videos
curl "http://localhost:8000/api/content/recommendations/videos/trending/"

# Test with authentication
curl -H "Authorization: Bearer your-jwt-token" \
     "http://localhost:8000/api/content/recommendations/home/?profile=1"

# Test interaction recording
curl -X POST \
     -H "Authorization: Bearer your-jwt-token" \
     -H "Content-Type: application/json" \
     -d '{"profile_id": 1, "interaction_type": "LIKE", "video_id": 1}' \
     "http://localhost:8000/api/content/recommendations/record-interaction/"
```

This recommendation system provides a solid foundation for a Netflix-like experience with personalized content discovery.