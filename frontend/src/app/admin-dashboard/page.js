'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import StatsCard from '@/components/admin/StatsCard';
import RecentActivity from '@/components/admin/RecentActivity';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import { Users, Video, Music, Film, Plus, BarChart3, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const quickActions = [
  { label: 'Add Video', href: '/admin-dashboard/videos/add', icon: Video, color: 'bg-purple-600 hover:bg-purple-700' },
  { label: 'Add Episode', href: '/admin-dashboard/episodes/add', icon: Film, color: 'bg-blue-600 hover:bg-blue-700' },
  { label: 'Add Music', href: '/admin-dashboard/music/add', icon: Music, color: 'bg-green-600 hover:bg-green-700' },
  { label: 'Analytics', href: '/admin-dashboard/analytics', icon: BarChart3, color: 'bg-orange-600 hover:bg-orange-700' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-gray-400 text-sm mt-0.5">Welcome back. Here's what's happening.</p>
        </div>
        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 text-gray-300 hover:text-white rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
          Failed to load stats: {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="Total Users" value={stats?.total_users || 0} icon={Users} color="blue" />
        <StatsCard title="Total Videos" value={stats?.total_videos || 0} icon={Video} color="purple" />
        <StatsCard title="Total Episodes" value={stats?.total_episodes || 0} icon={Film} color="red" />
        <StatsCard title="Total Music" value={stats?.total_music || 0} icon={Music} color="green" />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-white text-sm font-medium transition-colors ${action.color}`}
              >
                <Plus size={16} />
                <Icon size={16} />
                {action.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content Summary + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h2 className="text-base font-semibold text-white mb-4">Content Summary</h2>
          <div className="space-y-3">
            {[
              { label: 'Total Content Items', value: (stats?.total_videos || 0) + (stats?.total_episodes || 0) + (stats?.total_music || 0) },
              { label: 'Videos & Episodes', value: (stats?.total_videos || 0) + (stats?.total_episodes || 0) },
              { label: 'Music Tracks', value: stats?.total_music || 0 },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-gray-700/50 last:border-0">
                <span className="text-gray-400 text-sm">{label}</span>
                <span className="text-white font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <RecentActivity />
      </div>
    </div>
  );
}
