'use client';

import { useEffect, useState, useMemo } from 'react';
import { adminApi } from '@/lib/adminApi';
import { Tag, Plus, Trash2, Film, Music, RefreshCw } from 'lucide-react';
import SearchBar from '@/components/admin/SearchBar';
import ConfirmModal from '@/components/admin/ConfirmModal';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import EmptyState from '@/components/admin/EmptyState';
import { useToast } from '@/context/ToastContext';

const STORAGE_KEY = 'sv_custom_genres';

function loadCustomGenres() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveCustomGenres(genres) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(genres));
}

export default function GenreManager() {
  const [videoGenres, setVideoGenres] = useState([]);
  const [musicGenres, setMusicGenres] = useState([]);
  const [customGenres, setCustomGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newGenre, setNewGenre] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setCustomGenres(loadCustomGenres());
    fetchGenres();
  }, []);

  const fetchGenres = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [videos, music] = await Promise.all([
        adminApi.getVideos(),
        adminApi.getMusic(),
      ]);
      const vg = [...new Set(videos.map(v => v.genre).filter(Boolean))].sort();
      const mg = [...new Set(music.map(m => m.genre).filter(Boolean))].sort();
      setVideoGenres(vg);
      setMusicGenres(mg);
    } catch {
      toast.error('Failed to load genres');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAdd = () => {
    const trimmed = newGenre.trim();
    if (!trimmed) return;
    if (allGenres.map(g => g.toLowerCase()).includes(trimmed.toLowerCase())) {
      toast.warning('Genre already exists');
      return;
    }
    const updated = [...customGenres, trimmed].sort();
    setCustomGenres(updated);
    saveCustomGenres(updated);
    setNewGenre('');
    toast.success(`"${trimmed}" added`);
  };

  const handleDelete = () => {
    const updated = customGenres.filter(g => g !== deleteTarget);
    setCustomGenres(updated);
    saveCustomGenres(updated);
    setDeleteTarget(null);
    toast.success('Genre removed');
  };

  const allGenres = useMemo(() =>
    [...new Set([...videoGenres, ...musicGenres, ...customGenres])].sort(),
    [videoGenres, musicGenres, customGenres]);

  const filtered = useMemo(() =>
    allGenres.filter(g => g.toLowerCase().includes(search.toLowerCase())),
    [allGenres, search]);

  const getType = (genre) => {
    const inVideo = videoGenres.includes(genre);
    const inMusic = musicGenres.includes(genre);
    const inCustom = customGenres.includes(genre);
    return { inVideo, inMusic, inCustom };
  };

  if (loading) return <LoadingSpinner message="Loading genres..." />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Genre Manager</h1>
          <p className="text-gray-400 text-sm mt-0.5">{allGenres.length} genres across your content</p>
        </div>
        <button
          onClick={() => fetchGenres(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 text-gray-300 hover:text-white rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Film, label: 'Video Genres', value: videoGenres.length, color: 'text-purple-400' },
          { icon: Music, label: 'Music Genres', value: musicGenres.length, color: 'text-green-400' },
          { icon: Tag, label: 'Custom Genres', value: customGenres.length, color: 'text-blue-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center gap-3">
            <Icon size={18} className={color} />
            <div>
              <p className="text-white font-semibold">{value}</p>
              <p className="text-gray-400 text-xs">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add new genre */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <p className="text-sm font-medium text-gray-300 mb-3">Add Custom Genre</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newGenre}
            onChange={e => setNewGenre(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="e.g. Cyberpunk, Lo-fi, Docudrama..."
            className="flex-1 bg-gray-700 text-white text-sm px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-500"
          />
          <button
            onClick={handleAdd}
            disabled={!newGenre.trim()}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} />
            Add
          </button>
        </div>
        <p className="text-gray-500 text-xs mt-2">Custom genres are stored locally and available as reference when adding content.</p>
      </div>

      {/* Search + List */}
      <div className="space-y-3">
        <div className="w-full sm:w-72">
          <SearchBar value={search} onChange={setSearch} placeholder="Search genres..." />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Tag} message={search ? `No genres matching "${search}"` : 'No genres found'} />
        ) : (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Genre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Used In</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map((genre) => {
                  const { inVideo, inMusic, inCustom } = getType(genre);
                  return (
                    <tr key={genre} className="hover:bg-gray-700/40 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{genre}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 flex-wrap">
                          {inVideo && (
                            <span className="flex items-center gap-1 text-xs bg-purple-600/20 text-purple-400 border border-purple-600/30 px-2 py-0.5 rounded">
                              <Film size={11} /> Video
                            </span>
                          )}
                          {inMusic && (
                            <span className="flex items-center gap-1 text-xs bg-green-600/20 text-green-400 border border-green-600/30 px-2 py-0.5 rounded">
                              <Music size={11} /> Music
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          inCustom ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' : 'bg-gray-700 text-gray-400'
                        }`}>
                          {inCustom ? 'Custom' : 'From content'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {inCustom ? (
                          <button
                            onClick={() => setDeleteTarget(genre)}
                            className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                            title="Remove custom genre"
                          >
                            <Trash2 size={15} />
                          </button>
                        ) : (
                          <span className="text-gray-600 text-xs">Auto-managed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-500">
              {filtered.length} genre{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Remove Genre"
        message={`Remove "${deleteTarget}" from your custom genres list? This won't affect existing content.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
