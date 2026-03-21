'use client';

import { useEffect, useState, useMemo } from 'react';
import { adminApi } from '@/lib/adminApi';
import { Trash2, Edit, Plus, Music } from 'lucide-react';
import Link from 'next/link';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import EmptyState from '@/components/admin/EmptyState';
import SearchBar from '@/components/admin/SearchBar';
import ConfirmModal from '@/components/admin/ConfirmModal';
import SortableHeader from '@/components/admin/SortableHeader';
import Pagination from '@/components/admin/Pagination';
import { useSort } from '@/hooks/useSort';
import { useToast } from '@/context/ToastContext';

const PAGE_SIZE = 10;

export default function MusicManagement() {
  const [music, setMusic] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage] = useState(1);
  const toast = useToast();

  useEffect(() => { fetchMusic(); }, []);
  useEffect(() => { setPage(1); }, [search]);

  const fetchMusic = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getMusic();
      setMusic(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await adminApi.deleteMusic(deleteTarget);
      setDeleteTarget(null);
      fetchMusic();
      toast.success('Track deleted successfully');
    } catch {
      toast.error('Failed to delete music');
    }
  };

  const filtered = useMemo(() =>
    music.filter((m) =>
      m.title?.toLowerCase().includes(search.toLowerCase()) ||
      m.artist?.toLowerCase().includes(search.toLowerCase()) ||
      m.genre?.toLowerCase().includes(search.toLowerCase())
    ), [music, search]);

  const { sorted, sortConfig, handleSort } = useSort(filtered, 'title');
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const sharedHeaderProps = { sortConfig, onSort: handleSort };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Manage Music</h1>
        <Link
          href="/admin-dashboard/music/add"
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Music
        </Link>
      </div>

      <div className="w-full sm:w-72">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by title, artist, or genre..." />
      </div>

      {loading ? (
        <LoadingSpinner message="Loading music..." />
      ) : sorted.length === 0 ? (
        <EmptyState icon={Music} message={search ? `No tracks matching "${search}"` : 'No music found'} />
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">#</th>
                  <SortableHeader label="Title" sortKey="title" {...sharedHeaderProps} />
                  <SortableHeader label="Artist" sortKey="artist" {...sharedHeaderProps} />
                  <SortableHeader label="Album" sortKey="album" {...sharedHeaderProps} />
                  <SortableHeader label="Genre" sortKey="genre" {...sharedHeaderProps} />
                  <SortableHeader label="Duration" sortKey="duration" {...sharedHeaderProps} />
                  <SortableHeader label="Plays" sortKey="play_count" {...sharedHeaderProps} />
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {paginated.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-700/40 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{(page - 1) * PAGE_SIZE + index + 1}</td>
                    <td className="px-4 py-3 text-white font-medium max-w-[180px] truncate">{item.title}</td>
                    <td className="px-4 py-3 text-gray-400">{item.artist}</td>
                    <td className="px-4 py-3 text-gray-400">{item.album || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{item.genre}</td>
                    <td className="px-4 py-3 text-gray-400">
                      {item.duration ? `${Math.floor(item.duration / 60)}m ${item.duration % 60}s` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{item.play_count ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link href={`/admin-dashboard/music/edit/${item.id}`} className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded transition-colors" title="Edit">
                          <Edit size={16} />
                        </Link>
                        <button onClick={() => setDeleteTarget(item.id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-500">
            Showing {Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length} tracks
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Track"
        message="This will permanently delete the music track. This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
