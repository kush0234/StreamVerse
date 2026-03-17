'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import VideoPlayer from '@/components/VideoPlayer';
import interactionTracker from '@/lib/interactionTracker';

export default function DetailPage() {
  const router = useRouter();
  const params = useParams();
  const [content, setContent] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [similarContent, setSimilarContent] = useState([]);
  const [currentEpisode, setCurrentEpisode] = useState(null);

  useEffect(() => {
    loadContent();

    // Initialize interaction tracker with current profile
    const profile = JSON.parse(localStorage.getItem('selected_profile'));
    if (profile) {
      interactionTracker.updateProfile(profile.id);
    }
  }, [params.id]);

  // Re-check watchlist status when page becomes visible (user returns from another tab/page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && content) {
        checkWatchlistStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [content, params.id]);

  const loadContent = async () => {
    const token = localStorage.getItem('access_token');
    const profile = JSON.parse(localStorage.getItem('selected_profile'));

    if (!profile) {
      router.push('/profiles');
      return;
    }

    try {
      const contentData = await api.getVideoDetail(token, params.id);
      setContent(contentData);

      if (contentData.content_type === 'SERIES') {
        const episodesData = await api.getEpisodes(token, params.id);
        setEpisodes(episodesData);

        // Get unique seasons
        if (episodesData.length > 0) {
          setSelectedSeason(episodesData[0].season_number);
        }
      }

      // Check if in watchlist
      await checkWatchlistStatus();

      // Load similar content
      const similarData = await api.getSimilarContent(token, params.id);
      setSimilarContent(similarData);

      // Track view interaction
      const profile = JSON.parse(localStorage.getItem('selected_profile'));
      if (profile) {
        interactionTracker.trackView(params.id, 'video');
      }
    } catch (err) {
      console.error('Failed to load content', err);
    } finally {
      setLoading(false);
    }
  };

  const checkWatchlistStatus = async () => {
    const token = localStorage.getItem('access_token');
    const profile = JSON.parse(localStorage.getItem('selected_profile'));

    if (!profile) return;

    try {
      const watchlistData = await api.getWatchlist(token, profile.id);
      const isInList = watchlistData.some(item => item.video?.id === parseInt(params.id));
      setInWatchlist(isInList);
    } catch (err) {
      console.error('Failed to check watchlist status', err);
    }
  };

  const toggleWatchlist = async () => {
    const token = localStorage.getItem('access_token');
    const profile = JSON.parse(localStorage.getItem('selected_profile'));

    if (!profile) {
      router.push('/profiles');
      return;
    }

    // Optimistically update UI
    const previousState = inWatchlist;
    setInWatchlist(!inWatchlist);

    try {
      if (previousState) {
        await api.removeFromWatchlist(token, profile.id, params.id);
        // Track watchlist removal
        interactionTracker.trackWatchlistRemove(params.id, 'video');
      } else {
        await api.addToWatchlist(token, profile.id, params.id);
        // Track watchlist addition
        interactionTracker.trackWatchlistAdd(params.id, 'video');
      }
      // Verify the change by re-checking watchlist status
      await checkWatchlistStatus();
    } catch (err) {
      console.error('Failed to toggle watchlist', err);
      // Revert on error
      setInWatchlist(previousState);
      alert('Failed to update watchlist. Please try again.');
    }
  };

  // Progress tracking for continue watching
  const lastSavedTimeRef = { current: 0 };

  const handleTimeUpdate = async (currentTime) => {
    const token = localStorage.getItem('access_token');
    const profile = JSON.parse(localStorage.getItem('selected_profile'));

    if (!profile || !content) return;

    // Save every 10 seconds using a ref to track last saved time
    if (currentTime - lastSavedTimeRef.current < 10) return;
    lastSavedTimeRef.current = currentTime;

    const videoId = content.id;
    const episodeId = currentEpisode ? currentEpisode.id : null;
    const duration = currentEpisode ? currentEpisode.duration : content.duration;

    await api.saveVideoProgress(token, profile.id, videoId, currentTime, duration, episodeId);
  };

  // Handle video end
  const handleVideoEnd = () => {
    const contentId = currentEpisode ? currentEpisode.id : content.id;
    const contentType = currentEpisode ? 'episode' : 'video';
    interactionTracker.trackComplete(contentId, contentType);
  };

  // Get unique seasons
  const seasons = [...new Set(episodes.map(ep => ep.season_number))].sort((a, b) => a - b);

  // Filter episodes by selected season
  const filteredEpisodes = episodes.filter(ep => ep.season_number === selectedSeason);

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'similar', label: 'Similar' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Content not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero Section with Backdrop */}
      <div className="relative h-[90vh]">
        {content.thumbnail && (
          <div className="absolute inset-0">
            <img
              src={content.thumbnail}
              alt={content.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
          </div>
        )}

        <div className="relative h-full flex items-end px-12 pb-8">
          <div className="max-w-7xl w-full">
            <div className="flex items-end gap-8">
              {/* Poster */}
              <div className="flex-shrink-0 w-64 rounded-lg overflow-hidden shadow-2xl border-4 border-gray-700">
                <img
                  src={content.thumbnail}
                  alt={content.title}
                  className="w-full h-auto"
                />
              </div>

              {/* Title and Actions */}
              <div className="flex-1 pb-4">
                <h1 className="text-6xl font-bold mb-4">{content.title}</h1>

                <div className="flex items-center gap-4 mb-6">
                  <span className="flex items-center gap-2 text-yellow-400 font-bold text-lg">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {content.rating}
                  </span>
                  <span className="px-3 py-1 bg-gray-700 rounded text-sm font-semibold">
                    {content.genre}
                  </span>
                  <span className="text-gray-300">{content.release_date?.split('-')[0]}</span>
                  {content.duration && (
                    <span className="text-gray-300">{Math.round(content.duration / 60)} min</span>
                  )}
                </div>

                <p className="text-lg text-gray-300 mb-6 leading-relaxed max-w-3xl">
                  {content.description}
                </p>

                <div className="flex gap-4">
                  <button
                    onClick={() => document.getElementById('video-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="flex items-center gap-3 bg-red-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-red-700 transition"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                    Play Now
                  </button>

                  <button
                    onClick={toggleWatchlist}
                    className="flex items-center gap-3 bg-gray-800/90 backdrop-blur-sm px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-700 transition border border-gray-600"
                  >
                    {inWatchlist ? (
                      <>
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        In Watchlist
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Watchlist
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trailer or Video Player Section */}
      <div id="video-section" className="bg-gray-900 py-12">
        <div className="max-w-5xl mx-auto px-12">
          {content.youtube_trailer_url ? (
            /* Show Trailer */
            <div>
              <h2 className="text-3xl font-bold mb-6">Trailer</h2>
              <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                <iframe
                  width="100%"
                  height="100%"
                  src={content.youtube_trailer_url.replace('watch?v=', 'embed/')}
                  title="Trailer"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  className="w-full h-full"
                ></iframe>
              </div>
            </div>
          ) : (
            /* Show Video Player or Episodes */
            <div>
              {content.content_type === 'SERIES' && seasons.length > 0 ? (
                <div>
                  <h2 className="text-3xl font-bold mb-8">Episodes</h2>

                  {/* Inline episode player */}
                  {currentEpisode && (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-semibold text-white">
                          S{currentEpisode.season_number}E{currentEpisode.episode_number}: {currentEpisode.title}
                        </h3>
                        <button
                          onClick={() => setCurrentEpisode(null)}
                          className="text-gray-400 hover:text-white transition text-sm"
                        >
                          Close ✕
                        </button>
                      </div>
                      {currentEpisode.video_file ? (
                        <VideoPlayer
                          videoData={{
                            is_public_domain: true,
                            video_url: currentEpisode.video_file,
                            title: `${content.title} - S${currentEpisode.season_number}E${currentEpisode.episode_number}: ${currentEpisode.title}`,
                            thumbnail: currentEpisode.thumbnail,
                            id: currentEpisode.id,
                          }}
                          onTimeUpdate={handleTimeUpdate}
                          onEnded={handleVideoEnd}
                        />
                      ) : (
                        <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                          <p className="text-gray-400">Episode video not available</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Season Selector */}
                  <div className="flex gap-4 mb-8 overflow-x-auto pb-4">
                    {seasons.map((season) => (
                      <button
                        key={season}
                        onClick={() => setSelectedSeason(season)}
                        className={`px-6 py-3 rounded-lg font-bold whitespace-nowrap transition ${selectedSeason === season
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-800 text-white hover:bg-gray-700'
                          }`}
                      >
                        Season {season}
                      </button>
                    ))}
                  </div>

                  {/* Episodes List */}
                  <div className="space-y-4">
                    {filteredEpisodes.map((episode) => (
                      <div
                        key={episode.id}
                        className={`group flex gap-6 bg-gray-800 p-4 rounded-lg hover:bg-gray-750 transition cursor-pointer ${currentEpisode?.id === episode.id ? 'ring-2 ring-red-600' : ''}`}
                        onClick={() => setCurrentEpisode(episode)}
                      >
                        <div className="flex-shrink-0 w-48 aspect-video bg-gray-700 rounded overflow-hidden relative">
                          {episode.thumbnail ? (
                            <img
                              src={episode.thumbnail}
                              alt={episode.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-500">
                              {episode.episode_number}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg">
                              {episode.episode_number}. {episode.title}
                            </h3>
                            <span className="text-sm text-gray-400">
                              {Math.round(episode.duration / 60)} min
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">
                            Season {episode.season_number}, Episode {episode.episode_number}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Movie - Inline Video Player */
                <div>
                  <h2 className="text-3xl font-bold mb-6">Watch Now</h2>
                  {content.video_file ? (
                    <VideoPlayer
                      videoData={{
                        is_public_domain: content.is_public_domain || true,
                        video_url: content.video_file,
                        title: content.title,
                        thumbnail: content.thumbnail,
                        id: content.id,
                      }}
                      onTimeUpdate={handleTimeUpdate}
                      onEnded={handleVideoEnd}
                    />
                  ) : (
                    <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                      <p className="text-gray-400 text-lg">Video not available</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-gray-900 border-b border-gray-800 sticky top-[64px] z-40">
        <div className="max-w-7xl mx-auto px-12">
          <div className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 font-semibold text-lg transition relative ${activeTab === tab.id
                  ? 'text-white'
                  : 'text-gray-400 hover:text-gray-200'
                  }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-gray-900 pb-16">
        <div className="max-w-7xl mx-auto px-12 py-12">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-12">
              {/* Description */}
              <div>
                <h2 className="text-2xl font-bold mb-4">Overview</h2>
                <p className="text-gray-300 text-lg leading-relaxed">{content.description}</p>
              </div>

              {/* Metadata Grid */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex border-b border-gray-800 pb-3">
                    <span className="text-gray-400 w-48">Release Date</span>
                    <span className="text-white font-semibold">{content.release_date || 'N/A'}</span>
                  </div>
                  <div className="flex border-b border-gray-800 pb-3">
                    <span className="text-gray-400 w-48">Status</span>
                    <span className="text-white font-semibold">
                      {content.is_coming_soon ? 'Coming Soon' : 'Released'}
                    </span>
                  </div>
                  <div className="flex border-b border-gray-800 pb-3">
                    <span className="text-gray-400 w-48">Original Title</span>
                    <span className="text-white font-semibold">{content.title}</span>
                  </div>
                  <div className="flex border-b border-gray-800 pb-3">
                    <span className="text-gray-400 w-48">Runtime</span>
                    <span className="text-white font-semibold">
                      {content.duration ? `${Math.round(content.duration / 60)} min` : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex border-b border-gray-800 pb-3">
                    <span className="text-gray-400 w-48">Genre</span>
                    <span className="text-white font-semibold">{content.genre}</span>
                  </div>
                  <div className="flex border-b border-gray-800 pb-3">
                    <span className="text-gray-400 w-48">Rating</span>
                    <span className="text-white font-semibold">{content.rating}/10</span>
                  </div>
                  <div className="flex border-b border-gray-800 pb-3">
                    <span className="text-gray-400 w-48">Content Type</span>
                    <span className="text-white font-semibold">
                      {content.content_type === 'MOVIE' ? 'Movie' : 'TV Series'}
                    </span>
                  </div>
                  {content.content_type === 'SERIES' && seasons.length > 0 && (
                    <div className="flex border-b border-gray-800 pb-3">
                      <span className="text-gray-400 w-48">Seasons</span>
                      <span className="text-white font-semibold">{seasons.length}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {content.tags && content.tags.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-3">
                    {content.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="px-4 py-2 bg-gray-800 rounded-full text-sm font-semibold hover:bg-gray-700 transition"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="text-center py-16">
              <div className="text-gray-400 text-lg">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <p>No reviews yet</p>
              </div>
            </div>
          )}

          {/* Similar Tab */}
          {activeTab === 'similar' && (
            <div>
              {similarContent.length > 0 ? (
                <>
                  <h2 className="text-2xl font-bold mb-6">Similar Content</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {similarContent.map((item) => (
                      <div
                        key={item.id}
                        className="group cursor-pointer"
                        onClick={() => router.push(`/detail/${item.id}`)}
                      >
                        <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-3">
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition flex items-center justify-center">
                            <svg className="w-16 h-16 opacity-0 group-hover:opacity-100 transition" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                          <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 rounded text-xs font-semibold">
                            {item.rating}
                          </div>
                        </div>
                        <h3 className="font-semibold text-white group-hover:text-red-500 transition line-clamp-2">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                          <span>{item.release_date?.split('-')[0]}</span>
                          <span>•</span>
                          <span>{item.genre.split(',')[0]}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <div className="text-gray-400 text-lg">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                    </svg>
                    <p>No similar content available</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Video Player Modal - removed, using inline player */}
      {false && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Close Button */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => {
                setShowPlayer(false);
                setCurrentEpisode(null);
              }}
              className="bg-black/80 hover:bg-black text-white p-3 rounded-full transition"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Video Title */}
          <div className="absolute top-4 left-4 z-10 bg-black/80 px-6 py-3 rounded-lg">
            <h2 className="text-2xl font-bold">
              {currentEpisode ? `${content.title} - S${currentEpisode.season_number}E${currentEpisode.episode_number}: ${currentEpisode.title}` : content.title}
            </h2>
          </div>

          {/* Video Player */}
          <div className="flex-1 flex items-center justify-center p-4">
            {currentEpisode ? (
              /* Episode Player */
              currentEpisode.video_file ? (
                <VideoPlayer
                  videoData={{
                    is_public_domain: true, // Assuming episodes are public domain
                    video_url: currentEpisode.video_file,
                    title: `${content.title} - S${currentEpisode.season_number}E${currentEpisode.episode_number}: ${currentEpisode.title}`,
                    thumbnail: currentEpisode.thumbnail,
                    id: currentEpisode.id
                  }}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleVideoEnd}
                />
              ) : (
                <div className="text-center text-gray-400">
                  <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xl">Episode video not available</p>
                </div>
              )
            ) : (
              /* Movie Player */
              content.video_file ? (
                <VideoPlayer
                  videoData={{
                    is_public_domain: content.is_public_domain || true,
                    video_url: content.video_file,
                    title: content.title,
                    thumbnail: content.thumbnail,
                    id: content.id
                  }}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleVideoEnd}
                />
              ) : (
                <div className="text-center text-gray-400">
                  <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xl">Video not available</p>
                </div>
              )
            )}
          </div>

          {/* Episode Navigation (for series) */}
          {content.content_type === 'SERIES' && episodes.length > 0 && (
            <div className="bg-gray-900 p-4 max-h-48 overflow-y-auto">
              <h3 className="text-lg font-bold mb-3">Episodes</h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {filteredEpisodes.map((episode) => (
                  <button
                    key={episode.id}
                    onClick={() => {
                      setCurrentEpisode(episode);
                    }}
                    className={`flex-shrink-0 w-40 ${currentEpisode?.id === episode.id ? 'ring-2 ring-red-600' : ''
                      }`}
                  >
                    <div className="relative aspect-video bg-gray-800 rounded overflow-hidden mb-2">
                      {episode.thumbnail ? (
                        <img
                          src={episode.thumbnail}
                          alt={episode.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold">
                          {episode.episode_number}
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-semibold truncate">
                      {episode.episode_number}. {episode.title}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
