import { getValidAccessToken } from './api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const adminApi = {
  // Dashboard Overview
  async getDashboardStats() {
    const token = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/admin-dashboard/overview/stats/`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  async getRecentActivities(limit = 20) {
    const token = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/admin-dashboard/overview/recent_activities/?limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch recent activities');
    return res.json();
  },

  // Video Management
  async getVideos(contentType = null) {
    const token = await getValidAccessToken();
    const url = contentType
      ? `${API_BASE_URL}/admin-dashboard/videos/?content_type=${contentType}`
      : `${API_BASE_URL}/admin-dashboard/videos/`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch videos');
    return res.json();
  },

  async getVideoById(id) {
    const token = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/admin-dashboard/videos/${id}/`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch video');
    return res.json();
  },

  async createVideo(data) {
    const token = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/admin-dashboard/videos/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to create video');
    }
    return res.json();
  },

  async updateVideo(id, data) {
    const token = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/admin-dashboard/videos/${id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to update video');
    }
    return res.json();
  },

  async deleteVideo(id) {
    const token = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/admin-dashboard/videos/${id}/`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to delete video');
    return res.ok;
  },

  // Episode Management
  async getEpisodes(seriesId = null) {
    const token = await getValidAccessToken();
    const url = seriesId
      ? `${API_BASE_URL}/admin-dashboard/episodes/?series_id=${seriesId}`
      : `${API_BASE_URL}/admin-dashboard/episodes/`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch episodes');
    return res.json();
  },

  async createEpisode(data) {
    const token = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/admin-dashboard/episodes/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to create episode');
    }
    return res.json();
  },

  async updateEpisode(id, data) {
    const token = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/admin-dashboard/episodes/${id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to update episode');
    }
    return res.json();
  },

  async deleteEpisode(id) {
    const token = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/admin-dashboard/episodes/${id}/`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to delete episode');
    return res.ok;
  },

  // Music Management
  async getMusic() {
    const token = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/admin-dashboard/music/`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch music');
    return res.json();
  },

  async createMusic(data) {
    const token = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/admin-dashboard/music/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to create music');
    }
    return res.json();
  },

  async updateMusic(id, data) {
    const token = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/admin-dashboard/music/${id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to update music');
    }
    return res.json();
  },

  async deleteMusic(id) {
    const token = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/admin-dashboard/music/${id}/`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to delete music');
    return res.ok;
  },

  // Analytics
  async getAnalytics() {
    const token = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/admin-dashboard/analytics/overview/`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  // Video Management with File Upload
  async createVideoWithFiles(formData) {
    const token = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/admin-dashboard/videos/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to create video');
    }
    return res.json();
  },

  async updateVideoWithFiles(id, formData) {
    const token = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/admin-dashboard/videos/${id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to update video');
    }
    return res.json();
  },

  // Episode Management with File Upload
  async createEpisodeWithFiles(formData) {
    const token = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/admin-dashboard/episodes/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to create episode');
    }
    return res.json();
  },

  async updateEpisodeWithFiles(id, formData) {
    const token = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/admin-dashboard/episodes/${id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to update episode');
    }
    return res.json();
  },

  // Music Management with File Upload
  async createMusicWithFiles(formData) {
    const token = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/admin-dashboard/music/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to create music');
    }
    return res.json();
  },

  async updateMusicWithFiles(id, formData) {
    const token = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/admin-dashboard/music/${id}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to update music');
    }
    return res.json();
  },
};
