'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import interactionTracker from '@/lib/interactionTracker';
import Navbar from '@/components/Navbar';
import ContentRow from '@/components/ContentRow';
import RecommendationRow from '@/components/RecommendationRow';
import ComingSoonSection from '@/components/ComingSoonSection';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import MusicPlayer from '@/components/MusicPlayer';

function BrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [music, setMusic] = useState([]);
  const [trending, setTrending] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [recentlyWatched, setRecentlyWatched] = useState([]);
  const [comingSoon, setComingSoon] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [selectedMusicId, setSelectedMusicId] = useState(null);
  
  // New recommendation states
  const [recommendations, setRecommendations] = useState({
    continue_watching: [],
    trending_videos: [],
    top_video_picks: [],
    because_you_watched: [],
    trending_music: [],
    top_music_picks: [],
    because_you_listened: []
  });
  const [useEnhancedRecommendations, setUseEnhancedRecommendations] = useState(true);
  
  const type = searchParams.get('type');

  // Get carousel items with safety check
  const carouselItems = useEnhancedRecommendations && recommendations.trending_videos.length > 0 
    ? recommendations.trending_videos.slice(0, Math.min(5, recommendations.trending_videos.length))
    : trending.slice(0, Math.min(5, trending.length));
  const maxCarouselIndex = carouselItems.length - 1;

  useEffect(() => {
    // Set up global function to open music player
    window.openMusicPlayer = (musicId) => {
      setSelectedMusicId(musicId);
      // Track music play interaction
      interactionTracker.trackPlay(musicId, 'music');
    };

    return () => {
      delete window.openMusicPlayer;
    };
  }, []);

  useEffect(() => {
    if (!type && carouselItems.length > 1) {
      const interval = setInterval(() => {
        setHeroIndex((prev) => {
          const nextIndex = prev >= maxCarouselIndex ? 0 : prev + 1;
          return nextIndex;
        });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [type, carouselItems.length, maxCarouselIndex]);

  // Reset hero index when trending data changes
  useEffect(() => {
    if (carouselItems.length > 0 && heroIndex > maxCarouselIndex) {
      setHeroIndex(0);
    }
  }, [carouselItems.length, maxCarouselIndex, heroIndex]);

  useEffect(() => {
    const profile = localStorage.getItem('selected_profile');
    if (!profile) {
      router.push('/profiles');
      return;
    }
    
    // Update interaction tracker with current profile
    try {
      const profileData = JSON.parse(profile);
      interactionTracker.updateProfile(profileData.id);
    } catch (e) {
      console.warn('Failed to parse profile for interaction tracker');
    }
    
    loadContent();
  }, [router, type, selectedGenre, selectedTag]);

  const loadContent = async () => {
    const token = localStorage.getItem('access_token');
    const profile = JSON.parse(localStorage.getItem('selected_profile'));
    setLoading(true);

    try {
      // If a tag is selected, load content by tag
      if (selectedTag) {
        const taggedContent = await api.getVideosByTag(token, selectedTag.slug);
        setMovies(taggedContent.filter(v => v.content_type === 'MOVIE'));
        setSeries(taggedContent.filter(v => v.content_type === 'SERIES'));
        setLoading(false);
        return;
      }

      if (type === 'MOVIE') {
        const movieData = await api.getVideos(token, 'MOVIE');
        setMovies(selectedGenre ? movieData.filter(m => m.genre && m.genre.toLowerCase().includes(selectedGenre.toLowerCase())) : movieData);

        const genreData = await api.getGenres(token, 'video');
        setGenres(genreData.genres || []);
      } else if (type === 'SERIES') {
        const seriesData = await api.getVideos(token, 'SERIES');
        setSeries(selectedGenre ? seriesData.filter(s => s.genre && s.genre.toLowerCase().includes(selectedGenre.toLowerCase())) : seriesData);

        const genreData = await api.getGenres(token, 'video');
        setGenres(genreData.genres || []);
      } else {
        // Load both traditional and enhanced recommendations
        try {
          // Try to load enhanced recommendations first
          const homeRecommendations = await api.getHomeRecommendations(token, profile.id);
          setRecommendations(homeRecommendations);
          setUseEnhancedRecommendations(true);
          
          // Also load traditional data as fallback
          const [movieData, seriesData, musicData, comingSoonData] = await Promise.all([
            api.getVideos(token, 'MOVIE'),
            api.getVideos(token, 'SERIES'),
            api.getMusic(token),
            api.getComingSoon(token),
          ]);
          
          setMovies(movieData || []);
          setSeries(seriesData || []);
          setMusic(musicData || []);
          setComingSoon(comingSoonData || []);
          
        } catch (recommendationError) {
          console.warn('Enhanced recommendations failed, falling back to traditional:', recommendationError);
          setUseEnhancedRecommendations(false);
          
          // Fallback to traditional API calls
          const [movieData, seriesData, musicData, trendingData, continueData, recentData, comingSoonData] = await Promise.all([
            api.getVideos(token, 'MOVIE'),
            api.getVideos(token, 'SERIES'),
            api.getMusic(token),
            api.getTrendingVideos(token),
            api.getContinueWatching(token, profile.id),
            api.getRecentlyWatched(token, profile.id),
            api.getComingSoon(token),
          ]);
          
          setMovies(movieData || []);
          setSeries(seriesData || []);
          setMusic(musicData || []);
          setTrending(trendingData || []);
          setContinueWatching(continueData || []);
          setRecentlyWatched(recentData || []);
          setComingSoon(comingSoonData || []);
        }
      }
    } catch (err) {
      console.error('Failed to load content', err);
      // Set empty arrays to prevent undefined errors
      setMovies([]);
      setSeries([]);
      setMusic([]);
      setTrending([]);
      setContinueWatching([]);
      setRecentlyWatched([]);
      setComingSoon([]);
      setRecommendations({
        continue_watching: [],
        trending_videos: [],
        top_video_picks: [],
        because_you_watched: [],
        trending_music: [],
        top_music_picks: [],
        because_you_listened: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHeroClick = (item, action = 'play') => {
    if (action === 'play') {
      // Track view interaction
      interactionTracker.trackView(item.id, 'video');
      router.push(`/detail/${item.id}`);
    } else if (action === 'info') {
      router.push(`/detail/${item.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-20">
          <div className="px-8 py-12">
            <div className="h-10 bg-gray-800 rounded w-64 mb-8 animate-pulse"></div>
          </div>
          <LoadingSkeleton />
          <div className="mt-8">
            <LoadingSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="pt-16">
        {/* Hero Carousel */}
        {!type && carouselItems.length > 0 && (
          <div className="relative h-[85vh] mb-8">
            {carouselItems.map((item, index) => (
              <div
                key={item.id}
                className={`absolute inset-0 transition-opacity duration-1000 ${index === heroIndex ? 'opacity-100' : 'opacity-0'
                  }`}
              >
                {item.thumbnail && (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />

                <div className="absolute bottom-0 left-0 p-12 max-w-2xl">
                  <div className="animate-fade-in">
                    <h1 className="text-6xl font-bold mb-4 text-shadow">{item.title}</h1>
                    <div className="flex gap-4 text-sm mb-4">
                      <span className="px-3 py-1 bg-red-600 rounded font-semibold">TRENDING</span>
                      {item.rating && (
                        <span className="flex items-center gap-1">
                          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {item.rating}
                        </span>
                      )}
                      {item.genre && <span>{item.genre}</span>}
                    </div>
                    {item.description && (
                      <p className="text-lg text-gray-300 mb-6 line-clamp-3">{item.description}</p>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleHeroClick(item, 'play')}
                        className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-200 transition transform hover:scale-105"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                        Play Now
                      </button>

                      <button
                        onClick={() => handleHeroClick(item, 'info')}
                        className="flex items-center gap-2 bg-gray-700/80 backdrop-blur-sm px-8 py-3 rounded-lg font-semibold hover:bg-gray-600/80 transition transform hover:scale-105"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        More Info
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Carousel indicators - moved outside the map loop */}
            {carouselItems.length > 1 && (
              <div className="absolute bottom-8 right-8 flex gap-2">
                {carouselItems.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setHeroIndex(idx)}
                    className={`h-1 rounded-full transition-all ${idx === heroIndex ? 'w-8 bg-white' : 'w-6 bg-gray-500'
                      }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Genre Filter */}
        {(type === 'MOVIE' || type === 'SERIES') && genres.length > 0 && !selectedTag && (
          <div className="px-8 mb-6 pt-4">
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              <button
                onClick={() => setSelectedGenre(null)}
                className={`px-6 py-2 rounded-full whitespace-nowrap transition transform hover:scale-105 ${!selectedGenre
                  ? 'bg-white text-black shadow-lg'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
              >
                All Genres
              </button>
              {genres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-6 py-2 rounded-full whitespace-nowrap transition transform hover:scale-105 ${selectedGenre === genre
                    ? 'bg-white text-black shadow-lg'
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                    }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content Rows */}
        <div className="space-y-8 pb-12">
          {/* Enhanced Recommendations */}
          {!type && !selectedTag && !selectedGenre && useEnhancedRecommendations && (
            <>
              {/* Continue Watching - Enhanced */}
              {recommendations.continue_watching.length > 0 && (
                <RecommendationRow 
                  title="Continue Watching" 
                  items={recommendations.continue_watching} 
                  type="continue_watching"
                />
              )}

              {/* Top Video Picks */}
              {recommendations.top_video_picks.length > 0 && (
                <ContentRow title="Top Picks For You" items={recommendations.top_video_picks} />
              )}

              {/* Because You Watched */}
              {recommendations.because_you_watched.length > 0 && (
                <ContentRow title="Because You Watched" items={recommendations.because_you_watched} />
              )}

              {/* Trending Videos */}
              {recommendations.trending_videos.length > 0 && (
                <ContentRow title="Trending Now" items={recommendations.trending_videos} />
              )}

              {/* Top Music Picks */}
              {recommendations.top_music_picks.length > 0 && (
                <ContentRow title="Recommended Music" items={recommendations.top_music_picks} type="music" />
              )}

              {/* Because You Listened */}
              {recommendations.because_you_listened.length > 0 && (
                <ContentRow title="Because You Listened To" items={recommendations.because_you_listened} type="music" />
              )}

              {/* Trending Music */}
              {recommendations.trending_music.length > 0 && (
                <ContentRow title="Trending Music" items={recommendations.trending_music} type="music" />
              )}
            </>
          )}

          {/* Traditional Content Rows (fallback or when filtering) */}
          {(!useEnhancedRecommendations || type || selectedTag || selectedGenre) && (
            <>
              {/* Coming Soon Section - Only on main page, not when filtering */}
              {!type && !selectedTag && !selectedGenre && comingSoon.length > 0 && (
                <ComingSoonSection items={comingSoon} />
              )}

              {!type && continueWatching.length > 0 && (
                <ContentRow title="Continue Watching" items={continueWatching.map(h => h.video)} />
              )}

              {(!type || type === 'MOVIE') && movies.length > 0 && (
                <ContentRow title="Movies" items={movies} />
              )}

              {(!type || type === 'SERIES') && series.length > 0 && (
                <ContentRow title="Web Series" items={series} />
              )}

              {!type && recentlyWatched.length > 0 && (
                <ContentRow title="Recently Watched" items={recentlyWatched.map(h => h.video)} />
              )}

              {!type && music.length > 0 && (
                <ContentRow title="Music" items={music} type="music" />
              )}
            </>
          )}

          {/* Coming Soon - Always show if available and not filtering */}
          {!type && !selectedTag && !selectedGenre && comingSoon.length > 0 && useEnhancedRecommendations && (
            <ComingSoonSection items={comingSoon} />
          )}

          {/* No content message */}
          {((useEnhancedRecommendations && Object.values(recommendations).every(arr => arr.length === 0)) ||
            (!useEnhancedRecommendations && movies.length === 0 && series.length === 0)) && (
            <div className="text-center py-20">
              <div className="inline-block p-6 bg-gray-900 rounded-full mb-4">
                <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
              </div>
              <p className="text-gray-400 text-xl">No content available yet.</p>
              <p className="text-gray-500 mt-2">Add some content from the Django admin panel.</p>
            </div>
          )}
        </div>
      </div>

      {/* Music Player Modal */}
      {selectedMusicId && (
        <MusicPlayer
          musicId={selectedMusicId}
          onClose={() => setSelectedMusicId(null)}
        />
      )}
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-20">
          <div className="px-8 py-12">
            <div className="h-10 bg-gray-800 rounded w-64 mb-8 animate-pulse"></div>
          </div>
          <LoadingSkeleton />
          <div className="mt-8">
            <LoadingSkeleton />
          </div>
        </div>
      </div>
    }>
      <BrowseContent />
    </Suspense>
  );
}
