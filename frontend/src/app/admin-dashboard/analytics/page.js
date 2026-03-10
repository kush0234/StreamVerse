'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const data = await adminApi.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">User Statistics</h2>
          <div className="space-y-3 text-gray-300">
            <div className="flex justify-between">
              <span>New Users This Month:</span>
              <span className="font-semibold">{analytics?.new_users_this_month || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Active Users:</span>
              <span className="font-semibold">{analytics?.total_active_users || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Content Statistics</h2>
          <div className="space-y-3 text-gray-300">
            <div className="flex justify-between">
              <span>Total Videos:</span>
              <span className="font-semibold">{analytics?.most_viewed_videos?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Music:</span>
              <span className="font-semibold">{analytics?.most_played_music?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Most Viewed Videos</h2>
          <div className="space-y-2">
            {analytics?.most_viewed_videos?.slice(0, 10).map((video, idx) => (
              <div key={video.id} className="flex justify-between text-gray-300">
                <span className="truncate">{idx + 1}. {video.title}</span>
                <span className="text-blue-500 ml-2 flex-shrink-0">{video.view_count} views</span>
              </div>
            ))}
            {(!analytics?.most_viewed_videos || analytics.most_viewed_videos.length === 0) && (
              <p className="text-gray-500 text-center py-4">No video data available</p>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Most Played Music</h2>
          <div className="space-y-2">
            {analytics?.most_played_music?.slice(0, 10).map((music, idx) => (
              <div key={music.id} className="flex justify-between text-gray-300">
                <span className="truncate">{idx + 1}. {music.title} - {music.artist}</span>
                <span className="text-green-500 ml-2 flex-shrink-0">{music.play_count} plays</span>
              </div>
            ))}
            {(!analytics?.most_played_music || analytics.most_played_music.length === 0) && (
              <p className="text-gray-500 text-center py-4">No music data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
