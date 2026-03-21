'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { feedbackApi } from '@/lib/feedbackApi';
import { Eye, MessageSquare, ThumbsUp, Edit, Pin, PinOff, Trash2, MessageCircle } from 'lucide-react';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import EmptyState from '@/components/admin/EmptyState';
import SearchBar from '@/components/admin/SearchBar';
import ConfirmModal from '@/components/admin/ConfirmModal';
import { useToast } from '@/context/ToastContext';

const STATUS_COLORS = {
  SUBMITTED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  UNDER_REVIEW: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  IN_PROGRESS: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  COMPLETED: 'bg-green-500/20 text-green-400 border-green-500/30',
  CLOSED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const STAT_CARDS = [
  { key: 'total', label: 'Total', cls: 'bg-gray-800 border-gray-700', textCls: 'text-white' },
  { key: 'SUBMITTED', label: 'Submitted', cls: 'bg-blue-500/10 border-blue-500/30', textCls: 'text-blue-400' },
  { key: 'UNDER_REVIEW', label: 'Under Review', cls: 'bg-yellow-500/10 border-yellow-500/30', textCls: 'text-yellow-400' },
  { key: 'IN_PROGRESS', label: 'In Progress', cls: 'bg-purple-500/10 border-purple-500/30', textCls: 'text-purple-400' },
  { key: 'COMPLETED', label: 'Completed', cls: 'bg-green-500/10 border-green-500/30', textCls: 'text-green-400' },
  { key: 'REJECTED', label: 'Rejected', cls: 'bg-red-500/10 border-red-500/30', textCls: 'text-red-400' },
];

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const toast = useToast();

  useEffect(() => { loadData(); }, [selectedCategory, selectedStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [feedbackData, categoriesData, statsData] = await Promise.all([
        feedbackApi.getAllFeedback({ category: selectedCategory, status: selectedStatus }),
        feedbackApi.getCategories(),
        feedbackApi.getStats(),
      ]);
      setFeedbacks(feedbackData);
      setCategories(categoriesData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePin = async (feedbackId, currentPinned) => {
    try {
      await feedbackApi.updateFeedback(feedbackId, { is_pinned: !currentPinned });
      toast.success(currentPinned ? 'Feedback unpinned' : 'Feedback pinned');
      loadData();
    } catch {
      toast.error('Failed to update feedback');
    }
  };

  const handleDelete = async () => {
    try {
      await feedbackApi.deleteFeedback(deleteTarget);
      setDeleteTarget(null);
      toast.success('Feedback deleted');
      loadData();
    } catch {
      toast.error('Failed to delete feedback');
    }
  };

  const filtered = useMemo(() =>
    feedbacks.filter((f) =>
      f.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username?.toLowerCase().includes(searchQuery.toLowerCase())
    ), [feedbacks, searchQuery]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Feedback Management</h1>
        <p className="text-gray-400 text-sm mt-0.5">Manage user feedback and suggestions</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAT_CARDS.map(({ key, label, cls, textCls }) => (
            <div key={key} className={`rounded-xl p-4 border ${cls}`}>
              <p className={`text-xs mb-1 ${textCls}`}>{label}</p>
              <p className="text-2xl font-bold text-white">
                {key === 'total' ? stats.total_feedback : (stats.by_status?.[key] || 0)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search feedback..." />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>{cat.icon} {cat.name}</option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Status</option>
            {Object.keys(STATUS_COLORS).map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner message="Loading feedback..." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={MessageCircle} message="No feedback found" />
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-gray-400 uppercase text-xs tracking-wider">
                <tr>
                  {['#', 'Feedback', 'Category', 'Status', 'Stats', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map((feedback, index) => (
                  <tr key={feedback.id} className="hover:bg-gray-700/40 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <div className="flex items-start gap-1.5">
                        {feedback.is_pinned && <span className="text-yellow-400 flex-shrink-0 mt-0.5">📌</span>}
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate">{feedback.title}</p>
                          <p className="text-xs text-gray-500">by {feedback.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {feedback.category_icon} {feedback.category_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_COLORS[feedback.status] || STATUS_COLORS.SUBMITTED}`}>
                        {feedback.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><ThumbsUp size={12} />{feedback.vote_score}</span>
                        <span className="flex items-center gap-1"><MessageSquare size={12} />{feedback.comments_count}</span>
                        <span className="flex items-center gap-1"><Eye size={12} />{feedback.views_count}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(feedback.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => router.push(`/admin-dashboard/feedback/${feedback.id}`)}
                          className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                          title="View/Edit"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleTogglePin(feedback.id, feedback.is_pinned)}
                          className="p-1.5 text-yellow-400 hover:bg-yellow-500/20 rounded transition-colors"
                          title={feedback.is_pinned ? 'Unpin' : 'Pin'}
                        >
                          {feedback.is_pinned ? <PinOff size={15} /> : <Pin size={15} />}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(feedback.id)}
                          className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-500">
            Showing {filtered.length} of {feedbacks.length} feedback items
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Feedback"
        message="This will permanently delete the feedback and all its comments. This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
