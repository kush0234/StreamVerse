'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { Trash2, Edit, Plus } from 'lucide-react';
import Link from 'next/link';

export default function VideosManagement() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchVideos();
  }, [filter]);

  const fetchVideos = async () => {
    try {
      const contentType = filter === 'all' ? null : filter;
      const data = await adminApi.getVideos(contentType);
      setVideos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    
    try {
      await adminApi.deleteVideo(id);
      fetchVideos();
    } catch (err) {
      alert('Failed to delete video');
    }
  };

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Manage Videos</h1>
        <Link
          href="/admin-dashboard/videos/add"
          className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700"
        >
          <Plus size={20} />
          Add Video
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-red-600' : 'bg-gray-700'} text-white`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('MOVIE')}
          className={`px-4 py-2 rounded ${filter === 'MOVIE' ? 'bg-red-600' : 'bg-gray-700'} text-white`}
        >
          Movies
        </button>
        <button
          onClick={() => setFilter('SERIES')}
          className={`px-4 py-2 rounded ${filter === 'SERIES' ? 'bg-red-600' : 'bg-gray-700'} text-white`}
        >
          Series
        </button>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-white">Title</th>
              <th className="px-6 py-3 text-left text-white">Type</th>
              <th className="px-6 py-3 text-left text-white">Status</th>
              <th className="px-6 py-3 text-left text-white">Storage</th>
              <th className="px-6 py-3 text-left text-white">Genre</th>
              <th className="px-6 py-3 text-left text-white">Views</th>
              <th className="px-6 py-3 text-left text-white">Rating</th>
              <th className="px-6 py-3 text-left text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video) => (
              <tr key={video.id} className="border-t border-gray-700">
                <td className="px-6 py-4 text-white">
                  {video.title}
                  {video.is_coming_soon && (
                    <span className="ml-2 text-xs bg-purple-600 px-2 py-0.5 rounded">Coming Soon</span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-300">{video.content_type}</td>
                <td className="px-6 py-4">
                  {video.approval_status === 'APPROVED' && (
                    <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                      Approved
                    </span>
                  )}
                  {video.approval_status === 'PENDING' && (
                    <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded">
                      Pending
                    </span>
                  )}
                  {video.approval_status === 'REJECTED' && (
                    <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">
                      Rejected
                    </span>
                  )}
                  {video.approval_status === 'NEEDS_CHANGES' && (
                    <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded">
                      Needs Changes
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {video.is_public_domain ? (
                    <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                      Local
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">
                      YouTube
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-300">{video.genre}</td>
                <td className="px-6 py-4 text-gray-300">{video.view_count}</td>
                <td className="px-6 py-4 text-gray-300">{video.rating}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin-dashboard/videos/edit/${video.id}`}
                      className="text-blue-500 hover:text-blue-400"
                    >
                      <Edit size={18} />
                    </Link>
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
