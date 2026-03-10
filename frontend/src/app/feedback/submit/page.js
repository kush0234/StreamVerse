'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { feedbackApi } from '@/lib/feedbackApi';
import { ArrowLeft, Send } from 'lucide-react';

export default function SubmitFeedbackPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadCategories();
  }, [router]);

  const loadCategories = async () => {
    try {
      const data = await feedbackApi.getCategories();
      setCategories(data);
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, category: data[0].id }));
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await feedbackApi.createFeedback(formData);
      setSuccess(true);
      setTimeout(() => {
        router.push('/feedback');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 mt-16 max-w-3xl">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-2">Submit Feedback</h1>
          <p className="text-gray-400 mb-6">
            Help us improve StreamVerse by sharing your ideas and suggestions
          </p>

          {success && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg">
              <p className="text-green-400 text-center">
                ✓ Feedback submitted successfully! Redirecting...
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg">
              <p className="text-red-400 text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name} - {cat.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                maxLength={200}
                placeholder="Brief summary of your feedback"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.title.length}/200 characters</p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={8}
                placeholder="Provide detailed information about your feedback..."
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Submit Feedback
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
