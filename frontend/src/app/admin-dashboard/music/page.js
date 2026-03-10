'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { Trash2, Edit, Plus } from 'lucide-react';
import Link from 'next/link';

export default function MusicManagement() {
  const [music, setMusic] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMusic();
  }, []);

  const fetchMusic = async () => {
    try {
      const data = await adminApi.getMusic();
      setMusic(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this music?')) return;
    
    try {
      await adminApi.deleteMusic(id);
      fetchMusic();
    } catch (err) {
      alert('Failed to delete music');
    }
  };

  if (loading) return <div className="text-white">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Manage Music</h1>
        <Link
          href="/admin-dashboard/music/add"
          className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700"
        >
          <Plus size={20} />
          Add Music
        </Link>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-white">Title</th>
              <th className="px-6 py-3 text-left text-white">Artist</th>
              <th className="px-6 py-3 text-left text-white">Album</th>
              <th className="px-6 py-3 text-left text-white">Genre</th>
              <th className="px-6 py-3 text-left text-white">Plays</th>
              <th className="px-6 py-3 text-left text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {music.map((item) => (
              <tr key={item.id} className="border-t border-gray-700">
                <td className="px-6 py-4 text-white">{item.title}</td>
                <td className="px-6 py-4 text-gray-300">{item.artist}</td>
                <td className="px-6 py-4 text-gray-300">{item.album || 'N/A'}</td>
                <td className="px-6 py-4 text-gray-300">{item.genre}</td>
                <td className="px-6 py-4 text-gray-300">{item.play_count}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin-dashboard/music/edit/${item.id}`}
                      className="text-blue-500 hover:text-blue-400"
                    >
                      <Edit size={18} />
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
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
