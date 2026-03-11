'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import interactionTracker from '@/lib/interactionTracker';

export default function TestRecommendations() {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const profileStr = localStorage.getItem('selected_profile');
    if (profileStr) {
      try {
        const profileData = JSON.parse(profileStr);
        setProfile(profileData);
        interactionTracker.updateProfile(profileData.id);
        loadRecommendations(profileData.id);
      } catch (e) {
        setError('Failed to parse profile data');
        setLoading(false);
      }
    } else {
      setError('No profile selected');
      setLoading(false);
    }
  }, []);

  const loadRecommendations = async (profileId) => {
    const token = localStorage.getItem('access_token');
    
    try {
      const data = await api.getHomeRecommendations(token, profileId);
      setRecommendations(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testInteraction = async (type, contentId, contentType) => {
    const success = await interactionTracker.track(type, contentId, contentType);
    if (success) {
      alert(`Successfully tracked ${type} interaction for ${contentType} ${contentId}`);
      // Reload recommendations to see changes
      if (profile) {
        setLoading(true);
        await loadRecommendations(profile.id);
      }
    } else {
      alert(`Failed to track ${type} interaction`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-3xl font-bold mb-8">Testing Recommendations...</h1>
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-3xl font-bold mb-8 text-red-500">Error</h1>
        <p className="text-red-400">{error}</p>
        <button 
          onClick={() => window.location.href = '/profiles'}
          className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
        >
          Go to Profiles
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8">🎯 Recommendation System Test</h1>
      
      {profile && (
        <div className="mb-8 p-4 bg-gray-900 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Current Profile</h2>
          <p>Name: {profile.name}</p>
          <p>ID: {profile.id}</p>
        </div>
      )}

      {recommendations && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Continue Watching */}
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-blue-400">Continue Watching</h3>
              <p className="text-gray-300 mb-2">Count: {recommendations.continue_watching?.length || 0}</p>
              {recommendations.continue_watching?.slice(0, 3).map((item, idx) => (
                <div key={idx} className="text-sm text-gray-400 mb-1">
                  • {item.content?.title} ({item.progress_percentage?.toFixed(1)}%)
                </div>
              ))}
            </div>

            {/* Trending Videos */}
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-red-400">Trending Videos</h3>
              <p className="text-gray-300 mb-2">Count: {recommendations.trending_videos?.length || 0}</p>
              {recommendations.trending_videos?.slice(0, 3).map((item, idx) => (
                <div key={idx} className="text-sm text-gray-400 mb-1 flex justify-between">
                  <span>• {item.title}</span>
                  <button 
                    onClick={() => testInteraction('LIKE', item.id, 'video')}
                    className="text-xs bg-green-600 px-2 py-1 rounded hover:bg-green-700"
                  >
                    Like
                  </button>
                </div>
              ))}
            </div>

            {/* Top Video Picks */}
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-purple-400">Top Video Picks</h3>
              <p className="text-gray-300 mb-2">Count: {recommendations.top_video_picks?.length || 0}</p>
              {recommendations.top_video_picks?.slice(0, 3).map((item, idx) => (
                <div key={idx} className="text-sm text-gray-400 mb-1 flex justify-between">
                  <span>• {item.title}</span>
                  <button 
                    onClick={() => testInteraction('VIEW', item.id, 'video')}
                    className="text-xs bg-blue-600 px-2 py-1 rounded hover:bg-blue-700"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>

            {/* Because You Watched */}
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-yellow-400">Because You Watched</h3>
              <p className="text-gray-300 mb-2">Count: {recommendations.because_you_watched?.length || 0}</p>
              {recommendations.because_you_watched?.slice(0, 3).map((item, idx) => (
                <div key={idx} className="text-sm text-gray-400 mb-1">
                  • {item.title} ({item.genre})
                </div>
              ))}
            </div>

            {/* Trending Music */}
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-green-400">Trending Music</h3>
              <p className="text-gray-300 mb-2">Count: {recommendations.trending_music?.length || 0}</p>
              {recommendations.trending_music?.slice(0, 3).map((item, idx) => (
                <div key={idx} className="text-sm text-gray-400 mb-1 flex justify-between">
                  <span>• {item.title} - {item.artist}</span>
                  <button 
                    onClick={() => testInteraction('PLAY', item.id, 'music')}
                    className="text-xs bg-green-600 px-2 py-1 rounded hover:bg-green-700"
                  >
                    Play
                  </button>
                </div>
              ))}
            </div>

            {/* Top Music Picks */}
            <div className="bg-gray-900 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-pink-400">Top Music Picks</h3>
              <p className="text-gray-300 mb-2">Count: {recommendations.top_music_picks?.length || 0}</p>
              {recommendations.top_music_picks?.slice(0, 3).map((item, idx) => (
                <div key={idx} className="text-sm text-gray-400 mb-1 flex justify-between">
                  <span>• {item.title} - {item.artist}</span>
                  <button 
                    onClick={() => testInteraction('LIKE', item.id, 'music')}
                    className="text-xs bg-pink-600 px-2 py-1 rounded hover:bg-pink-700"
                  >
                    Like
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">🧪 Test Interactions</h3>
            <p className="text-gray-300 mb-4">
              Click the buttons above to test interaction tracking. After tracking interactions, 
              the recommendations should update to reflect your preferences.
            </p>
            <button 
              onClick={() => {
                setLoading(true);
                loadRecommendations(profile.id);
              }}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
            >
              🔄 Refresh Recommendations
            </button>
          </div>

          <div className="mt-8 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">📊 Raw API Response</h3>
            <pre className="text-xs text-gray-400 overflow-auto max-h-96 bg-black p-4 rounded">
              {JSON.stringify(recommendations, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div className="mt-8">
        <button 
          onClick={() => window.location.href = '/browse'}
          className="px-6 py-3 bg-red-600 rounded hover:bg-red-700 font-semibold"
        >
          ← Back to Browse
        </button>
      </div>
    </div>
  );
}