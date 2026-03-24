'use client';

import { useEffect, useState, useMemo } from 'react';
import { adminApi } from '@/lib/adminApi';
import { Trash2, Edit, Plus, Video } from 'lucide-react';
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
  NEEDS_CHANGES: 'bg-orange-600',
};

const FILTERS = ['all', 'MOVIE', 'SERIES'];

export default function VideosManagement() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage] = useState(1);
  const toast = useToast();

  useEffect(() => { fetchVideos(); }, [filter]);
  useEffect(() => { setPage(1); }, [filter, search]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getVideos(filter === 'all' ? null : filter);
      setVideos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await adminApi.deleteVideo(deleteTarget);
      setDeleteTarget(null);
      fetchVideos();
      toast.success('Video deleted successfully');
    } catch {
      toast.error('Failed to delete video');
    }
  };

  const filtered = useMemo(() =>
    videos.filter((v) =>
      v.title?.toLowerCase().includes(search.toLowerCase()) ||
      v.genre?.toLowerCase().includes(search.toLowerCase())
    ), [videos, search]);

  const { sorted, sortConfig, handleSort } = useSort(filtered, 'title');
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const sharedHeaderProps = { sortConfig, onSort: handleSort };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Manage Videos</h1>
        <Link
          href="/admin-dashboard/videos/add"
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Video
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                }`}
            >
              {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="sm:w-72">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by title or genre..." />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading videos..." />
      ) : sorted.length === 0 ? (
        <EmptyState icon={Video} message={search ? `No videos matching "${search}"` : 'No videos found'} />
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">#</th>
                  <SortableHeader label="Title" sortKey="title" {...sharedHeaderProps} />
                  <SortableHeader label="Type" sortKey="content_type" {...sharedHeaderProps} />
                  <SortableHeader label="Status" sortKey="approval_status" {...sharedHeaderProps} />
                  <SortableHeader label="Storage" sortKey="is_public_domain" {...sharedHeaderProps} />
                  <SortableHeader label="Genre" sortKey="genre" {...sharedHeaderProps} />
                  <SortableHeader label="Views" sortKey="view_count" {...sharedHeaderProps} />
                  <SortableHeader label="Rating" sortKey="rating" {...sharedHeaderProps} />
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {paginated.map((video, index) => (
                  <tr key={video.id} className="hover:bg-gray-700/40 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{(page - 1) * PAGE_SIZE + index + 1}</td>
                    <td className="px-4 py-3 text-white max-w-[200px]">
                      <div className="truncate font-medium">{video.title}</div>
                      {video.is_coming_soon && (
                        <span className="text-xs bg-purple-600/80 px-1.5 py-0.5 rounded text-white">Coming Soon</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{video.content_type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs text-white ${STATUS_STYLES[video.approval_status] || 'bg-gray-600'}`}>
                        {video.approval_status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs text-white ${video.is_public_domain ? 'bg-green-700' : 'bg-red-700'}`}>
                        {video.is_public_domain ? 'Local' : 'YouTube'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{video.genre || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{video.view_count ?? 0}</td>
                    <td className="px-4 py-3 text-gray-400">{video.rating ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link href={`/admin-dashboard/videos/edit/${video.id}`} className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded transition-colors" title="Edit">
                          <Edit size={16} />
                        </Link>
                        <button onClick={() => setDeleteTarget(video.id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors" title="Delete">
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
            Showing {Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length} videos
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Video"
        message="This will permanently delete the video and all associated data. This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
