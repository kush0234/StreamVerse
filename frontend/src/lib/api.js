const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Helper function to check if token is expired
const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= exp;
  } catch (error) {
    return true;
  }
};

// Helper function to refresh the access token
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const res = await fetch(`${API_BASE_URL}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!res.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await res.json();
    localStorage.setItem('access_token', data.access);
    return data.access;
  } catch (error) {
    // Clear tokens if refresh fails
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    throw error;
  }
};

// Helper function to get valid access token
export const getValidAccessToken = async () => {
  let accessToken = localStorage.getItem('access_token');

  if (isTokenExpired(accessToken)) {
    accessToken = await refreshAccessToken();
  }

  return accessToken;
};

export const api = {
  async register(username, email, password, password2) {
    const res = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, password2 }),
    });
    return res.json();
  },

  async login(username, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return res.json();
  },

  async getProfiles(token) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/auth/profiles/`, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.json();
  },

  async getUserInfo(token) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/auth/user-info/`, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    if (!res.ok) {
      throw new Error('Failed to fetch user info');
    }
    return res.json();
  },

  async createProfile(token, name, imageFile, maturityLevel = 'ADULT') {
    const validToken = await getValidAccessToken();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('maturity_level', maturityLevel);
    if (imageFile) formData.append('profile_image', imageFile);
    const res = await fetch(`${API_BASE_URL}/auth/profiles/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validToken}`,
      },
      body: formData,
    });
    if (!res.ok) {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await res.json();
        throw new Error(error.detail || error[0] || 'Failed to create profile');
      }
      throw new Error(`Server error: ${res.status}`);
    }
    return res.json();
  },

  async updateProfile(token, profileId, name, imageFile = null, maturityLevel = 'ADULT') {
    const validToken = await getValidAccessToken();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('maturity_level', maturityLevel);
    if (imageFile) formData.append('profile_image', imageFile);
    const res = await fetch(`${API_BASE_URL}/auth/profiles/${profileId}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${validToken}`,
      },
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to update profile');
    }
    return res.json();
  },

  async deleteProfile(token, profileId) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/auth/profiles/${profileId}/delete/`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.ok;
  },

  async changePassword(token, currentPassword, newPassword) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/auth/change-password/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.current_password?.[0] || error.new_password?.[0] || 'Failed to change password');
    }
    return res.json();
  },

  async deleteAccount(token) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/auth/delete-account/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      let errorMessage = 'Failed to delete account';
      try {
        const error = await res.json();
        errorMessage = error.detail || error.error || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = `${res.status}: ${res.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return res.json();
  },

  async requestPasswordReset(email) {
    const res = await fetch(`${API_BASE_URL}/auth/password-reset/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.email?.[0] || 'Failed to send reset email');
    }

    return res.json();
  },

  async confirmPasswordReset(token, newPassword) {
    const res = await fetch(`${API_BASE_URL}/auth/password-reset-confirm/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.token?.[0] || error.new_password?.[0] || 'Failed to reset password');
    }

    return res.json();
  },

  async getVideos(token, type = null) {
    const validToken = await getValidAccessToken();
    const url = type
      ? `${API_BASE_URL}/user/videos/?type=${type}`
      : `${API_BASE_URL}/user/videos/`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.json();
  },

  async getMusic(token) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/user/music/`, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.json();
  },

  async getArtists(token) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/user/artists/`, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.json();
  },

  async getArtistDetail(token, artistName) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/user/artists/${encodeURIComponent(artistName)}/`, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.json();
  },

  async getAlbums(token) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/user/albums/`, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.json();
  },

  async getAlbumDetail(token, artistName, albumTitle) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/user/albums/${encodeURIComponent(artistName)}/${encodeURIComponent(albumTitle)}/`, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.json();
  },

  async getContinueWatching(token, profileId) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/user/continue-watching/?profile=${profileId}`, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.json();
  },

  async getVideoDetail(token, id) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/user/videos/${id}/`, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.json();
  },

  async getSimilarContent(token, id) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/user/videos/${id}/similar/`, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.json();
  },

  async getEpisodes(token, seriesId) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/user/videos/${seriesId}/episodes/`, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.json();
  },

  async getMusicDetail(token, id) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/user/music/${id}/`, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.json();
  },

  async getTrendingVideos(token) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/user/videos/trending/`, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.json();
  },

  async getTrendingMusic(token) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/user/music/trending/`, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.json();
  },

  async getRecentlyWatched(token, profileId) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/user/recently-watched/?profile=${profileId}`, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.json();
  },

  async getWatchlist(token, profileId) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/user/watchlist/?profile=${profileId}`, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.json();
  },

  async addToWatchlist(token, profileId, videoId = null, musicId = null) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/user/watchlist/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profile: profileId, video: videoId, music: musicId }),
    });
    return res.json();
  },

  async removeFromWatchlist(token, profileId, videoId = null, musicId = null) {
    const validToken = await getValidAccessToken();
    const params = new URLSearchParams({ profile: profileId });
    if (videoId) params.append('video', videoId);
    if (musicId) params.append('music', musicId);

    const res = await fetch(`${API_BASE_URL}/user/watchlist/?${params}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.ok;
  },

  async getGenres(token, type = 'video') {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/user/genres/?type=${type}`, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.json();
  },

  // Subscription APIs
  async getSubscriptionPlans() {
    const res = await fetch(`${API_BASE_URL}/auth/subscription/plans/`);
    return res.json();
  },

  async getUserSubscription(token) {
    const validToken = await getValidAccessToken();
    try {
      const res = await fetch(`${API_BASE_URL}/auth/subscription/`, {
        headers: { 'Authorization': `Bearer ${validToken}` },
      });
      if (!res.ok) {
        if (res.status === 404) {
          return null; // No subscription found
        }
        // For other errors, try to parse error message
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await res.json();
          throw new Error(error.detail || 'Failed to fetch subscription');
        }
        throw new Error(`Server error: ${res.status}`);
      }
      return res.json();
    } catch (error) {
      console.error('Subscription fetch error:', error);
      return null; // Return null instead of throwing to prevent app crash
    }
  },

  async createSubscription(token, planId, billingCycle, paymentMethod) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/auth/subscription/create/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: planId,
        billing_cycle: billingCycle,
        payment_method: paymentMethod,
      }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create subscription');
    }
    return res.json();
  },

  async cancelSubscription(token) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/auth/subscription/cancel/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to cancel subscription');
    }
    return res.json();
  },

  async changeSubscriptionPlan(token, planId, billingCycle) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/auth/subscription/change-plan/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: planId,
        billing_cycle: billingCycle,
      }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to change subscription plan');
    }
    return res.json();
  },

  async getPaymentHistory(token) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/auth/payments/history/`, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.json();
  },

  // Razorpay Payment APIs
  async getRazorpayKey() {
    const res = await fetch(`${API_BASE_URL}/auth/payment/razorpay-key/`);
    const data = await res.json();
    return data.key_id;
  },

  async initiatePayment(token, planId, billingCycle) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/auth/payment/initiate/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: planId,
        billing_cycle: billingCycle,
      }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to initiate payment');
    }
    return res.json();
  },

  async verifyPayment(token, paymentData) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/auth/payment/verify/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to verify payment');
    }
    return res.json();
  },

  // Coming Soon Content
  async getComingSoon(token) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/user/videos/coming-soon/`, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.json();
  },

  // Tags
  async getTags(token, category = null) {
    const validToken = await getValidAccessToken();
    const url = category
      ? `${API_BASE_URL}/user/tags/?category=${category}`
      : `${API_BASE_URL}/user/tags/`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.json();
  },

  async getPopularTags(token, limit = 20) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/user/tags/popular/?limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.json();
  },

  async getVideosByTag(token, tagSlug) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/user/videos/by-tag/${tagSlug}/`, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.json();
  },

  // ===== RECOMMENDATION SYSTEM APIs =====

  // Get comprehensive home page recommendations
  async getHomeRecommendations(token, profileId) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/user/recommendations/home/?profile=${profileId}`, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    if (!res.ok) {
      throw new Error('Failed to fetch home recommendations');
    }
    return res.json();
  },

  // Get trending videos (enhanced)
  async getTrendingVideosEnhanced(token, days = 7, limit = 20) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/user/recommendations/videos/trending/?days=${days}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.json();
  },

  // Get trending music (enhanced)
  async getTrendingMusicEnhanced(token, days = 7, limit = 20) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/user/recommendations/music/trending/?days=${days}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.json();
  },

  // Get personalized video picks
  async getTopVideoPicks(token, profileId, limit = 20) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/user/recommendations/videos/top-picks/?profile=${profileId}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.json();
  },

  // Get personalized music picks
  async getTopMusicPicks(token, profileId, limit = 20) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/user/recommendations/music/top-picks/?profile=${profileId}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.json();
  },

  // Get continue watching (enhanced)
  async getContinueWatchingEnhanced(token, profileId, limit = 10) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/user/recommendations/continue-watching/?profile=${profileId}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.json();
  },

  // Get similar content (users also liked)
  async getSimilarContentEnhanced(token, contentId, contentType = 'video', limit = 15) {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/user/recommendations/similar/${contentId}/?type=${contentType}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${validToken}` },
    });
    return res.json();
  },

  // Record user interaction for recommendations
  async recordInteraction(token, profileId, interactionType, videoId = null, musicId = null, episodeId = null, duration = 0) {
    const validToken = await getValidAccessToken();

    const payload = {
      profile_id: profileId,
      interaction_type: interactionType,
      duration: duration
    };

    if (videoId) payload.video_id = videoId;
    if (musicId) payload.music_id = musicId;
    if (episodeId) payload.episode_id = episodeId;

    const res = await fetch(`${API_BASE_URL}/user/recommendations/record-interaction/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn('Failed to record interaction:', await res.text());
      return false;
    }

    return true;
  },

  // Update content similarity scores (admin only)
  async updateSimilarityScores(token, contentType = 'video') {
    const validToken = await getValidAccessToken();
    const res = await fetch(`${API_BASE_URL}/user/recommendations/update-similarity/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content_type: contentType }),
    });
    return res.json();
  },

  // Save video watch progress for continue watching
  async saveVideoProgress(token, profileId, videoId, currentTime, duration, episodeId = null) {
    const validToken = await getValidAccessToken();

    const payload = {
      profile: profileId,
      video: videoId,
      duration_watched: Math.floor(currentTime), // Backend expects duration_watched
      completed: duration > 0 ? (currentTime / duration) >= 0.9 : false // Mark as completed if 90% watched
    };

    if (episodeId) {
      payload.episode = episodeId;
    }

    const res = await fetch(`${API_BASE_URL}/user/watch-progress/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn('Failed to save video progress:', await res.text());
      return false;
    }

    return true;
  },
};
