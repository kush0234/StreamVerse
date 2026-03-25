import { api } from './api';

class InteractionTracker {
  constructor() {
    this.token = null;
    this.profileId = null;
    this.init();
  }

  init() {
    // Initialize with current token and profile
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
      const profile = localStorage.getItem('selected_profile');
      if (profile) {
        try {
          this.profileId = JSON.parse(profile).id;
        } catch (e) {
          console.warn('Failed to parse selected profile');
        }
      }
    }
  }

  updateProfile(profileId) {
    this.profileId = profileId;
  }

  async track(interactionType, contentId, contentType = 'video', duration = 0) {
    if (!this.token || !this.profileId) {
      console.warn('Cannot track interaction: missing token or profile');
      return false;
    }

    try {
      const payload = {
        video_id: contentType === 'video' ? contentId : null,
        music_id: contentType === 'music' ? contentId : null,
        episode_id: contentType === 'episode' ? contentId : null,
      };

      await api.recordInteraction(
        this.token,
        this.profileId,
        interactionType,
        payload.video_id,
        payload.music_id,
        payload.episode_id,
        duration
      );

      return true;
    } catch (error) {
      console.warn('Failed to track interaction:', error);
      return false;
    }
  }

  // Convenience methods for common interactions
  async trackView(contentId, contentType = 'video') {
    return this.track('VIEW', contentId, contentType);
  }

  async trackPlay(contentId, contentType = 'video') {
    return this.track('PLAY', contentId, contentType);
  }

  async trackPause(contentId, contentType = 'video', duration = 0) {
    return this.track('PAUSE', contentId, contentType, duration);
  }

  async trackComplete(contentId, contentType = 'video', duration = 0) {
    return this.track('COMPLETE', contentId, contentType, duration);
  }

  async trackLike(contentId, contentType = 'video') {
    return this.track('LIKE', contentId, contentType);
  }

  async trackDislike(contentId, contentType = 'video') {
    return this.track('DISLIKE', contentId, contentType);
  }

  async trackShare(contentId, contentType = 'video') {
    return this.track('SHARE', contentId, contentType);
  }

  async trackWatchlistAdd(contentId, contentType = 'video') {
    return this.track('WATCHLIST_ADD', contentId, contentType);
  }

  async trackWatchlistRemove(contentId, contentType = 'video') {
    return this.track('WATCHLIST_REMOVE', contentId, contentType);
  }

  async trackSkip(contentId, contentType = 'video', duration = 0) {
    return this.track('SKIP', contentId, contentType, duration);
  }
}

// Create a singleton instance
const interactionTracker = new InteractionTracker();

export default interactionTracker;