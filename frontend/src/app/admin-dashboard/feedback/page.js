'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { feedbackApi } from '@/lib/feedbackApi';
import { Eye, MessageSquare, ThumbsUp, Edit, Pin, PinOff, Trash2, Search } from 'lucide-react';

export default function AdminFeedbackPage() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    loadData();
  }, [selectedCategory, selectedStatus, searchQuery, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [feedbackData, categoriesData, statsData] = await Promise.all([
        feedbackApi.getAllFeedback({
          category: selectedCategory,
          status: selectedStatus,
          search: searchQuery,
        }),
        feedbackApi.getCategories(),
        feedbackApi.getStats(),
      ]);
      setFeedbacks(feedbackData);
      setCategories(categoriesData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load data:', err);
      // If authentication error, redirect to login
      if (err.message.includes('token') || err.message.includes('auth')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePin = async (feedbackId, currentPinned) => {
    try {
      await feedbackApi.updateFeedback(feedbackId, { is_pinned: !currentPinned });
      loadData();
    } catch (err) {
      console.error('Failed to toggle pin:', err);
      alert('Failed to update feedback');
    }
  };

  const handleDelete = async (feedbackId) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    try {
      await feedbackApi.deleteFeedback(feedbackId);
      loadData();
    } catch (err) {
      console.error('Failed to delete feedback:', err);
      alert('Failed to delete feedback');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      SUBMITTED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      UNDER_REVIEW: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      IN_PROGRESS: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      COMPLETED: 'bg-green-500/20 text-green-400 border-green-500/30',
      CLOSED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[status] || colors.SUBMITTED;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Feedback Management</h1>
        <p className="text-gray-400">Manage user feedback and suggestions</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-sm mb-1">Total</p>
            <p className="text-2xl font-bold text-white">{stats.total_feedback}</p>
          </div>
          <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
            <p className="text-blue-400 text-sm mb-1">Submitted</p>
            <p className="text-2xl font-bold text-white">{stats.by_status.SUBMITTED || 0}</p>
          </div>
          <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/30">
            <p className="text-yellow-400 text-sm mb-1">Under Review</p>
            <p className="text-2xl font-bold text-white">{stats.by_status.UNDER_REVIEW || 0}</p>
          </div>
          <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/30">
            <p className="text-purple-400 text-sm mb-1">In Progress</p>
            <p className="text-2xl font-bold text-white">{stats.by_status.IN_PROGRESS || 0}</p>
          </div>
          <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
            <p className="text-green-400 text-sm mb-1">Completed</p>
            <p className="text-2xl font-bold text-white">{stats.by_status.COMPLETED || 0}</p>
          </div>
          <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
            <p className="text-red-400 text-sm mb-1">Rejected</p>
            <p className="text-2xl font-bold text-white">{stats.by_status.REJECTED || 0}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Status</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CLOSED">Closed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Feedback List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading feedback...</p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-lg">No feedback found</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Feedback
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {feedbacks.map((feedback) => (
                  <tr key={feedback.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-2">
                        {feedback.is_pinned && (
                          <span className="text-yellow-400 flex-shrink-0 mt-1">📌</span>
                        )}
                        <div>
                          <p className="text-white font-medium">{feedback.title}</p>
                          <p className="text-sm text-gray-400">by {feedback.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm">
                        {feedback.category_icon} {feedback.category_name}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(feedback.status)}`}>
                        {feedback.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <ThumbsUp size={14} />
                          {feedback.vote_score}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare size={14} />
                          {feedback.comments_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={14} />
                          {feedback.views_count}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400">
                      {new Date(feedback.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/admin-dashboard/feedback/${feedback.id}`)}
                          className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                          title="View/Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleTogglePin(feedback.id, feedback.is_pinned)}
                          className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-colors"
                          title={feedback.is_pinned ? 'Unpin' : 'Pin'}
                        >
                          {feedback.is_pinned ? <PinOff size={18} /> : <Pin size={18} />}
                        </button>
                        <button
                          onClick={() => handleDelete(feedback.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Delete"
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
      )}
    </div>
  );
}
