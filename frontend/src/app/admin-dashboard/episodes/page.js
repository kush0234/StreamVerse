'use client';

import { useEffect, useState, useMemo } from 'react';
import { adminApi } from '@/lib/adminApi';
import { Trash2, Edit, Plus, Film } from 'lucide-react';
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

const STATUS_STYLES = {
  APPROVED: 'bg-green-600',
  PENDING: 'bg-yellow-600',
  REJECTED: 'bg-red-600',
};

export default function EpisodesManagement() {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [seriesFilter, setSeriesFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage] = useState(1);
  const toast = useToast();

  useEffect(() => { fetchEpisodes(); }, []);
  useEffect(() => { setPage(1); }, [search, seriesFilter]);

  const fetchEpisodes = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getEpisodes();
      setEpisodes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await adminApi.deleteEpisode(deleteTarget);
      setDeleteTarget(null);
      fetchEpisodes();
      toast.success('Episode deleted successfully');
    } catch {
      toast.error('Failed to delete episode');
    }
  };

  const seriesList = useMemo(() =>
    [...new Set(episodes.map((e) => e.series_title).filter(Boolean))].sort(),
    [episodes]);

  const filtered = useMemo(() =>
    episodes.filter((e) => {
      const matchSearch =
        e.title?.toLowerCase().includes(search.toLowerCase()) ||
        e.series_title?.toLowerCase().includes(search.toLowerCase());
      const matchSeries = seriesFilter ? e.series_title === seriesFilter : true;
      return matchSearch && matchSeries;
    }), [episodes, search, seriesFilter]);

  const { sorted, sortConfig, handleSort } = useSort(filtered, 'series_title');
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const sharedHeaderProps = { sortConfig, onSort: handleSort };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Manage Episodes</h1>
        <Link
          href="/admin-dashboard/episodes/add"
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Episode
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="sm:w-72">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by title or series..." />
        </div>
        <select
          value={seriesFilter}
          onChange={(e) => setSeriesFilter(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <option value="">All Series</option>
          {seriesList.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading episodes..." />
      ) : sorted.length === 0 ? (
        <EmptyState icon={Film} message={search || seriesFilter ? 'No episodes match your filters' : 'No episodes found'} />
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">#</th>
                  <SortableHeader label="Series" sortKey="series_title" {...sharedHeaderProps} />
                  <SortableHeader label="Episode Title" sortKey="title" {...sharedHeaderProps} />
                  <SortableHeader label="Season" sortKey="season_number" {...sharedHeaderProps} />
                  <SortableHeader label="Episode" sortKey="episode_number" {...sharedHeaderProps} />
                  <SortableHeader label="Duration" sortKey="duration" {...sharedHeaderProps} />
                  <SortableHeader label="Status" sortKey="approval_status" {...sharedHeaderProps} />
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {paginated.map((episode, index) => (
                  <tr key={episode.id} className="hover:bg-gray-700/40 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{(page - 1) * PAGE_SIZE + index + 1}</td>
                    <td className="px-4 py-3 text-white font-medium max-w-[160px] truncate">{episode.series_title}</td>
                    <td className="px-4 py-3 text-gray-300 max-w-[180px] truncate">{episode.title}</td>
                    <td className="px-4 py-3 text-gray-400">S{episode.season_number}</td>
                    <td className="px-4 py-3 text-gray-400">E{episode.episode_number}</td>
                    <td className="px-4 py-3 text-gray-400">{episode.duration ? `${Math.round(episode.duration / 60)} min` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs text-white ${STATUS_STYLES[episode.approval_status] || 'bg-gray-600'}`}>
                        {episode.approval_status || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link href={`/admin-dashboard/episodes/edit/${episode.id}`} className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded transition-colors" title="Edit">
                          <Edit size={16} />
                        </Link>
                        <button onClick={() => setDeleteTarget(episode.id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors" title="Delete">
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
            Showing {Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length} episodes
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Episode"
        message="This will permanently delete the episode. This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
