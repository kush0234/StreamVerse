'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { feedbackApi } from '@/lib/feedbackApi';
import { ArrowLeft, Save, ThumbsUp, MessageSquare, Eye } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import Breadcrumb from '@/components/admin/Breadcrumb';

export default function AdminFeedbackDetailPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const feedbackId = params.id;

  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    admin_response: '',
    is_pinned: false,
  });

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    loadFeedback();
  }, [feedbackId, router]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const data = await feedbackApi.getFeedbackById(feedbackId);
      setFeedback(data);
      setFormData({
        status: data.status,
        admin_response: data.admin_response || '',
        is_pinned: data.is_pinned,
      });
    } catch (err) {
      console.error('Failed to load feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await feedbackApi.updateFeedback(feedbackId, formData);
      toast.success('Feedback updated successfully');
      router.push('/admin-dashboard/feedback');
    } catch (err) {
      console.error('Failed to update feedback:', err);
      toast.error('Failed to update feedback');
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading feedback...</p>
        </div>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">Feedback not found</p>
          <button
            onClick={() => router.push('/admin-dashboard/feedback')}
            className="mt-4 text-red-500 hover:text-red-400"
          >
            Back to Feedback List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Breadcrumb items={[{ label: 'Feedback', href: '/admin-dashboard/feedback' }, { label: feedback?.title || 'Detail' }]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feedback Details (Left) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              {feedback.is_pinned && (
                <span className="bg-yellow-500/20 text-yellow-400 text-xs px-3 py-1 rounded border border-yellow-500/30">
                  📌 Pinned
                </span>
              )}
              <span className={`text-xs px-3 py-1 rounded border ${getStatusColor(feedback.status)}`}>
                {feedback.status.replace('_', ' ')}
              </span>
              {feedback.category_icon && (
                <span className="text-sm bg-gray-700 px-3 py-1 rounded">
                  {feedback.category_icon} {feedback.category_name}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-white mb-4">{feedback.title}</h1>

            <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
              <span>by {feedback.username}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ThumbsUp size={16} />
                {feedback.vote_score} votes
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MessageSquare size={16} />
                {feedback.comments_count} comments
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye size={16} />
                {feedback.views_count} views
              </span>
            </div>

            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 whitespace-pre-wrap">{feedback.description}</p>
            </div>
          </div>

          {/* Comments */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <MessageSquare size={24} />
              Comments ({feedback.comments_count})
            </h2>

            <div className="space-y-4">
              {feedback.comments && feedback.comments.length > 0 ? (
                feedback.comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {comment.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{comment.username}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(comment.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-300 ml-10">{comment.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No comments yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Admin Actions (Right) */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 sticky top-6">
            <h2 className="text-xl font-bold text-white mb-4">Admin Actions</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="SUBMITTED">Submitted</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CLOSED">Closed</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              {/* Pin */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_pinned"
                  name="is_pinned"
                  checked={formData.is_pinned}
                  onChange={handleChange}
                  className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                />
                <label htmlFor="is_pinned" className="text-sm font-medium text-gray-300">
                  Pin this feedback
                </label>
              </div>

              {/* Admin Response */}
              <div>
                <label htmlFor="admin_response" className="block text-sm font-medium text-gray-300 mb-2">
                  Admin Response
                </label>
                <textarea
                  id="admin_response"
                  name="admin_response"
                  value={formData.admin_response}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Provide a response to the user..."
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Save Changes
                  </>
                )}
              </button>
            </form>

            {/* Metadata */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Metadata</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-400">Created:</span>
                  <span className="text-white ml-2">
                    {new Date(feedback.created_at).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Updated:</span>
                  <span className="text-white ml-2">
                    {new Date(feedback.updated_at).toLocaleString()}
                  </span>
                </div>
                {feedback.admin_response_at && (
                  <div>
                    <span className="text-gray-400">Response Date:</span>
                    <span className="text-white ml-2">
                      {new Date(feedback.admin_response_at).toLocaleString()}
                    </span>
                  </div>
                )}
                {feedback.admin_response_by && (
                  <div>
                    <span className="text-gray-400">Response By:</span>
                    <span className="text-white ml-2">{feedback.admin_response_by}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
