'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import StatsCard from '@/components/admin/StatsCard';
import RecentActivity from '@/components/admin/RecentActivity';
import { Users, Video, Music, Film } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await adminApi.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-white">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Users"
          value={stats?.total_users || 0}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Total Videos"
          value={stats?.total_videos || 0}
          icon={Video}
          color="purple"
        />
        <StatsCard
          title="Total Episodes"
          value={stats?.total_episodes || 0}
          icon={Film}
          color="red"
        />
        <StatsCard
          title="Total Music"
          value={stats?.total_music || 0}
          icon={Music}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Content Summary</h2>
          <div className="space-y-3 text-gray-300">
            <div className="flex justify-between">
              <span>Total Content Items:</span>
              <span className="font-semibold">
                {(stats?.total_videos || 0) + (stats?.total_episodes || 0) + (stats?.total_music || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Videos & Episodes:</span>
              <span className="font-semibold">
                {(stats?.total_videos || 0) + (stats?.total_episodes || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Music Tracks:</span>
              <span className="font-semibold">{stats?.total_music || 0}</span>
            </div>
          </div>
        </div>

        <RecentActivity />
      </div>
    </div>
  );
}
