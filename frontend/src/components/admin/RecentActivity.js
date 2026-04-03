'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/adminApi';
import { RefreshCw } from 'lucide-react';

export default function RecentActivity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getRecentActivities(15);
      setActivities(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getActivityColor = (color) => {
    const colors = {
      green: 'text-green-400 bg-green-400/10 border-green-400/20',
      blue: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
      purple: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
      red: 'text-red-400 bg-red-400/10 border-red-400/20',
      yellow: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
      orange: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
      gray: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
    };
    return colors[color] || colors.gray;
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Recent Activity</h2>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Recent Activity</h2>
          <button
            onClick={fetchActivities}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>
        <div className="text-red-400 text-center py-4">
          Failed to load activities: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Recent Activity</h2>
        <button
          onClick={fetchActivities}
          className="text-gray-400 hover:text-white transition-colors hover:rotate-180 duration-300"
          title="Refresh activities"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="text-gray-400 text-center py-8">
          <div className="text-4xl mb-2">📝</div>
          <p>No recent activities</p>
        </div>
      ) : (
        <div className="space-y-3 h-72 overflow-y-auto custom-scrollbar">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-700/50 transition-colors"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border ${getActivityColor(
                  activity.color
                )} flex-shrink-0`}
              >
                {activity.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm leading-relaxed">
                  {activity.description}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                  {activity.username && (
                    <span className="font-medium text-gray-300">
                      {activity.username}
                    </span>
                  )}
                  <span>•</span>
                  <span>{activity.time_ago}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
