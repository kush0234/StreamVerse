'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { Trash2, Edit, Plus } from 'lucide-react';
import Link from 'next/link';

export default function EpisodesManagement() {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEpisodes();
  }, []);

  const fetchEpisodes = async () => {
    try {
      const data = await adminApi.getEpisodes();
      setEpisodes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this episode?')) return;
    
    try {
      await adminApi.deleteEpisode(id);
      fetchEpisodes();
    } catch (err) {
      alert('Failed to delete episode');
    }
  };

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Manage Episodes</h1>
        <Link
          href="/admin-dashboard/episodes/add"
          className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700"
        >
          <Plus size={20} />
          Add Episode
        </Link>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-white">Series</th>
              <th className="px-6 py-3 text-left text-white">Episode Title</th>
              <th className="px-6 py-3 text-left text-white">Season</th>
              <th className="px-6 py-3 text-left text-white">Episode</th>
              <th className="px-6 py-3 text-left text-white">Duration</th>
              <th className="px-6 py-3 text-left text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {episodes.map((episode) => (
              <tr key={episode.id} className="border-t border-gray-700">
                <td className="px-6 py-4 text-white">{episode.series_title}</td>
                <td className="px-6 py-4 text-gray-300">{episode.title}</td>
                <td className="px-6 py-4 text-gray-300">S{episode.season_number}</td>
                <td className="px-6 py-4 text-gray-300">E{episode.episode_number}</td>
                <td className="px-6 py-4 text-gray-300">{Math.round(episode.duration / 60)} min</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin-dashboard/episodes/edit/${episode.id}`}
                      className="text-blue-500 hover:text-blue-400"
                    >
                      <Edit size={18} />
                    </Link>
                    <button
                      onClick={() => handleDelete(episode.id)}
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
