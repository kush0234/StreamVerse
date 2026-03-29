'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { feedbackApi } from '@/lib/feedbackApi';
import { ThumbsUp, ThumbsDown, MessageSquare, Eye, Plus, Filter, Search } from 'lucide-react';

export default function FeedbackPage() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedStatus, sortBy, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [feedbackData, categoriesData] = await Promise.all([
        feedbackApi.getAllFeedback({
          category: selectedCategory,
          status: selectedStatus,
          sort_by: sortBy,
          search: searchQuery,
        }),
        feedbackApi.getCategories(),
      ]);
      setFeedbacks(feedbackData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (feedbackId, voteType) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }
      await feedbackApi.voteFeedback(feedbackId, voteType);
      loadData();
    } catch (err) {
      console.error('Failed to vote:', err);
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
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 md:mb-2">Feedback Board</h1>
            <p className="text-gray-400 text-sm sm:text-base">Share your ideas and vote on suggestions</p>
          </div>
          <button
            onClick={() => router.push('/feedback/submit')}
            className="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg flex items-center gap-2 transition-colors text-sm sm:text-base"
          >
            <Plus size={18} />
            Submit Feedback
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {/* Search */}
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

            {/* Category Filter */}
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

            {/* Status Filter */}
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
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
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
            <button
              onClick={() => router.push('/feedback/submit')}
              className="mt-4 text-red-500 hover:text-red-400"
            >
              Be the first to submit feedback
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
                onClick={() => router.push(`/feedback/${feedback.id}`)}
              >
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {/* Vote Section */}
                  <div className="flex sm:flex-col items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(feedback.id, 'UP');
                      }}
                      className={`p-2 rounded-lg transition-colors ${feedback.user_vote === 'UP'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                    >
                      <ThumbsUp size={20} />
                    </button>
                    <span className="text-white font-bold text-lg">{feedback.vote_score}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(feedback.id, 'DOWN');
                      }}
                      className={`p-2 rounded-lg transition-colors ${feedback.user_vote === 'DOWN'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                    >
                      <ThumbsDown size={20} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {feedback.is_pinned && (
                          <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded border border-yellow-500/30">
                            📌 Pinned
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(feedback.status)}`}>
                          {feedback.status.replace('_', ' ')}
                        </span>
                        {feedback.category_icon && (
                          <span className="text-sm">{feedback.category_icon} {feedback.category_name}</span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-xl font-semibold text-white mb-2">{feedback.title}</h3>
                    <p className="text-gray-400 mb-4 line-clamp-2">{feedback.description}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>by {feedback.username}</span>
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
