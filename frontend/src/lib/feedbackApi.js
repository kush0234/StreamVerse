const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const getValidAccessToken = async () => {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) {
    throw new Error('No access token available');
  }
  return accessToken;
};

export const feedbackApi = {
  // Categories
  async getCategories() {
    const res = await fetch(`${API_BASE_URL}/feedback/categories/`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  // Feedback CRUD
  async getAllFeedback(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.category) queryParams.append('category', params.category);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.search) queryParams.append('search', params.search);
    
    const url = `${API_BASE_URL}/feedback/?${queryParams.toString()}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', res.status, errorText);
        throw new Error(`Failed to fetch feedback: ${res.status}`);
      }
      return res.json();
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  },

  async getFeedbackById(id) {
    const res = await fetch(`${API_BASE_URL}/feedback/${id}/`);
    if (!res.ok) throw new Error('Failed to fetch feedback');
    return res.json();
  },

  async createFeedback(data) {
    const token = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/feedback/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to create feedback');
    }
    return res.json();
  },

  async updateFeedback(id, data) {
    const token = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/feedback/${id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update feedback');
    return res.json();
  },

  async deleteFeedback(id) {
    const token = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/feedback/${id}/`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to delete feedback');
    return res.ok;
  },

  // Voting
  async voteFeedback(id, voteType) {
    const token = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/feedback/${id}/vote/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vote_type: voteType }),
    });
    if (!res.ok) throw new Error('Failed to vote');
    return res.json();
  },

  // Comments
  async addComment(id, comment) {
    const token = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/feedback/${id}/comment/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment }),
    });
    if (!res.ok) throw new Error('Failed to add comment');
    return res.json();
  },

  // My Feedback
  async getMyFeedback() {
    const token = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/feedback/my_feedback/`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch my feedback');
    return res.json();
  },

  // Stats
  async getStats() {
    try {
      const res = await fetch(`${API_BASE_URL}/feedback/stats/`);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Stats API Error:', res.status, errorText);
        throw new Error(`Failed to fetch stats: ${res.status}`);
      }
      return res.json();
    } catch (error) {
      console.error('Stats fetch error:', error);
      throw error;
    }
  },
};
