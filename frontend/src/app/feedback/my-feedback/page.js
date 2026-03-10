'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { feedbackApi } from '@/lib/feedbackApi';
import { ThumbsUp, MessageSquare, Eye, ArrowLeft, Plus } from 'lucide-react';

export default function MyFeedbackPage() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    by_status: {},
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadMyFeedback();
  }, [router]);

  const loadMyFeedback = async () => {
    try {
      setLoading(true);
      const data = await feedbackApi.getMyFeedback();
      setFeedbacks(data);
      
      // Calculate stats
      const statusCount = {};
      data.forEach(fb => {
        statusCount[fb.status] = (statusCount[fb.status] || 0) + 1;
      });
      setStats({
        total: data.length,
        by_status: statusCount,
      });
    } catch (err) {
      console.error('Failed to load my feedback:', err);
    } finally {
      setLoading(false);
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

  const getStatusLabel = (status) => {
    return status.replace('_', ' ');
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 mt-16 max-w-6xl">
        {/* Header */}
        <button
          onClick={() => router.push('/feedback')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Feedback Board
        </button>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">My Feedback</h1>
            <p className="text-gray-400">Track and manage your submitted feedback</p>
          </div>
          <button
            onClick={() => router.push('/feedback/submit')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Submit New
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-gray-400 text-sm mb-1">Total</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
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

        {/* Feedback List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading your feedback...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-lg mb-4">You haven't submitted any feedback yet</p>
            <button
              onClick={() => router.push('/feedback/submit')}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              Submit Your First Feedback
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
                onClick={() => router.push(`/feedback/${feedback.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {feedback.is_pinned && (
                      <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded border border-yellow-500/30">
                        📌 Pinned
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(feedback.status)}`}>
                      {getStatusLabel(feedback.status)}
                    </span>
                    {feedback.category_icon && (
                      <span className="text-sm bg-gray-700 px-2 py-1 rounded">
                        {feedback.category_icon} {feedback.category_name}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-white mb-2">{feedback.title}</h3>
                <p className="text-gray-400 mb-4 line-clamp-2">{feedback.description}</p>

                <div className="flex items-center gap-4 text-sm text-gray-500">
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
                  <span>•</span>
                  <span>{new Date(feedback.created_at).toLocaleDateString()}</span>
                </div>

                {/* Admin Response Indicator */}
                {feedback.admin_response && (
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-400 text-sm font-semibold mb-1">🛡️ Admin Response</p>
                    <p className="text-gray-300 text-sm line-clamp-2">{feedback.admin_response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
