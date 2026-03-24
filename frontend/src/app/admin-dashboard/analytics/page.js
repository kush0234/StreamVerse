'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import { Users, Video, Music, RefreshCw, Mic2, Film } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 flex items-center gap-4">
      <div className={`p-3 rounded-lg bg-gray-700 ${accent}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-gray-400 text-sm">{label}</p>
        <p className="text-white text-2xl font-bold">{value ?? 0}</p>
      </div>
    </div>
  );
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await adminApi.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading analytics..." />;

  const videoChartData = (analytics?.most_viewed_videos || [])
    .slice(0, 8)
    .map(v => ({ name: v.title.length > 16 ? v.title.slice(0, 16) + '…' : v.title, views: v.view_count }));

  const musicChartData = (analytics?.most_played_music || [])
    .slice(0, 8)
    .map(m => ({ name: m.title.length > 16 ? m.title.slice(0, 16) + '…' : m.title, plays: m.play_count }));

  // Plays grouped by artist
  const artistData = Object.values(
    (analytics?.most_played_music || []).reduce((acc, m) => {
      const artist = m.artist || 'Unknown';
      acc[artist] = acc[artist] || { artist: artist.length > 14 ? artist.slice(0, 14) + '…' : artist, plays: 0 };
      acc[artist].plays += m.play_count || 0;
      return acc;
    }, {})
  ).sort((a, b) => b.plays - a.plays).slice(0, 8);

  // Content type breakdown from videos
  const contentTypeData = Object.values(
    (analytics?.most_viewed_videos || []).reduce((acc, v) => {
      const type = v.content_type ? v.content_type.charAt(0).toUpperCase() + v.content_type.slice(1) : 'Other';
      acc[type] = acc[type] || { type, views: 0 };
      acc[type].views += v.view_count || 0;
      return acc;
    }, {})
  ).sort((a, b) => b.views - a.views);


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 text-sm mt-0.5">Platform performance overview</p>
        </div>
        <button
          onClick={() => fetchAnalytics(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 text-gray-300 hover:text-white rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="New Users This Month" value={analytics?.new_users_this_month} accent="text-blue-400" />
        <StatCard icon={Users} label="Total Active Users" value={analytics?.total_active_users} accent="text-blue-400" />
        <StatCard icon={Video} label="Top Videos Tracked" value={analytics?.most_viewed_videos?.length} accent="text-purple-400" />
        <StatCard icon={Music} label="Top Tracks Tracked" value={analytics?.most_played_music?.length} accent="text-green-400" />
      </div>

      {/* Charts Row: Videos + Music side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Most Viewed Videos Bar Chart */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Video size={18} className="text-purple-400" />
            <h2 className="text-base font-semibold text-white">Most Viewed Videos</h2>
          </div>
          {videoChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={videoChartData} margin={{ top: 4, right: 8, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} labelStyle={{ color: '#fff' }} itemStyle={{ color: '#a78bfa' }} />
                <Bar dataKey="views" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-16">No video data available</p>
          )}
        </div>

        {/* Most Played Music Bar Chart */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Music size={18} className="text-green-400" />
            <h2 className="text-base font-semibold text-white">Most Played Music</h2>
          </div>
          {musicChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={musicChartData} margin={{ top: 4, right: 8, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} labelStyle={{ color: '#fff' }} itemStyle={{ color: '#4ade80' }} />
                <Bar dataKey="plays" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-12">No music data available</p>
          )}
        </div>
      </div>

      {/* Bottom Row: Artist Plays + Content Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Plays by Artist */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Mic2 size={18} className="text-pink-400" />
            <h2 className="text-base font-semibold text-white">Plays by Artist</h2>
          </div>
          {artistData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={artistData} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis type="category" dataKey="artist" tick={{ fill: '#9ca3af', fontSize: 11 }} width={80} />
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} labelStyle={{ color: '#fff' }} itemStyle={{ color: '#f472b6' }} />
                <Bar dataKey="plays" fill="#ec4899" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-16">No artist data available</p>
          )}
        </div>

        {/* Content Type Breakdown */}
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Film size={18} className="text-orange-400" />
            <h2 className="text-base font-semibold text-white">Views by Content Type</h2>
          </div>
          {contentTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={contentTypeData} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis type="category" dataKey="type" tick={{ fill: '#9ca3af', fontSize: 11 }} width={60} />
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} labelStyle={{ color: '#fff' }} itemStyle={{ color: '#fb923c' }} />
                <Bar dataKey="views" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-sm text-center py-16">No content type data available</p>
          )}
        </div>

      </div>
    </div>
  );
}
