'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { feedbackApi } from '@/lib/feedbackApi';
import { ThumbsUp, ThumbsDown, MessageSquare, Eye, ArrowLeft, Send, Edit, Trash2 } from 'lucide-react';

export default function FeedbackDetailPage() {
  const router = useRouter();
  const params = useParams();
  const feedbackId = params.id;

  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    loadFeedback();
  }, [feedbackId]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const data = await feedbackApi.getFeedbackById(feedbackId);
      setFeedback(data);
      
      // Check if current user is the owner
      const selectedProfile = localStorage.getItem('selected_profile');
      if (selectedProfile) {
        const profile = JSON.parse(selectedProfile);
        setIsOwner(data.user === profile.user);
      }
    } catch (err) {
      console.error('Failed to load feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }
      await feedbackApi.voteFeedback(feedbackId, voteType);
      loadFeedback();
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      setSubmittingComment(true);
      await feedbackApi.addComment(feedbackId, commentText);
      setCommentText('');
      loadFeedback();
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    try {
      await feedbackApi.deleteFeedback(feedbackId);
      router.push('/feedback');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="container mx-auto px-4 py-8 mt-16">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading feedback...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="container mx-auto px-4 py-8 mt-16">
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Feedback not found</p>
            <button
              onClick={() => router.push('/feedback')}
              className="mt-4 text-red-500 hover:text-red-400"
            >
              Back to Feedback Board
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 mt-16 max-w-5xl">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Vote Section */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex lg:flex-col items-center gap-4 lg:gap-2 sticky top-20">
              <button
                onClick={() => handleVote('UP')}
                className={`p-3 rounded-lg transition-colors ${
                  feedback.user_vote === 'UP'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                <ThumbsUp size={24} />
              </button>
              <span className="text-white font-bold text-2xl">{feedback.vote_score}</span>
              <button
                onClick={() => handleVote('DOWN')}
                className={`p-3 rounded-lg transition-colors ${
                  feedback.user_vote === 'DOWN'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                <ThumbsDown size={24} />
              </button>
            </div>
          </div>

          {/* Content Section */}
          <div className="lg:col-span-11 space-y-6">
            {/* Feedback Details */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2 flex-wrap">
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
                
                {isOwner && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleDelete}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>

              <h1 className="text-3xl font-bold text-white mb-4">{feedback.title}</h1>
              
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
                <span>by {feedback.username}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Eye size={16} />
                  {feedback.views_count} views
                </span>
                <span>•</span>
                <span>{new Date(feedback.created_at).toLocaleDateString()}</span>
              </div>

              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 whitespace-pre-wrap">{feedback.description}</p>
              </div>

              {/* Admin Response */}
              {feedback.admin_response && (
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-400 font-semibold">🛡️ Admin Response</span>
                    {feedback.admin_response_by && (
                      <span className="text-sm text-gray-400">by {feedback.admin_response_by}</span>
                    )}
                  </div>
                  <p className="text-gray-300">{feedback.admin_response}</p>
                  {feedback.admin_response_at && (
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(feedback.admin_response_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <MessageSquare size={24} />
                Comments ({feedback.comments_count})
              </h2>

              {/* Add Comment Form */}
              <form onSubmit={handleCommentSubmit} className="mb-6">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add your comment..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || submittingComment}
                  className="mt-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  {submittingComment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Post Comment
                    </>
                  )}
                </button>
              </form>

              {/* Comments List */}
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
                  <p className="text-gray-400 text-center py-4">No comments yet. Be the first to comment!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
