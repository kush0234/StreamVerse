'use client';
import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import interactionTracker from '@/lib/interactionTracker';

export default function MusicPlayer({ musicId, onClose }) {
  const audioRef = useRef(null);
  const [music, setMusic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [showVolume, setShowVolume] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false);

  useEffect(() => {
    if (musicId) {
      loadMusic();
    }
  }, [musicId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const audio = audioRef.current;
      if (!audio) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          audio.currentTime = Math.max(0, audio.currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(prev => {
            const next = Math.min(100, prev + 10);
            audio.volume = next / 100;
            return next;
          });
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(prev => {
            const next = Math.max(0, prev - 10);
            audio.volume = next / 100;
            return next;
          });
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          if (audio.volume > 0) {
            audio.volume = 0;
            setVolume(0);
          } else {
            audio.volume = 1;
            setVolume(100);
          }
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          toggleLike();
          break;
        case 'Escape':
          e.preventDefault();
          handleClose();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [music, isPlaying, isLiked]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      if (audio.currentTime) {
        setCurrentTime(audio.currentTime);
      }
    };

    const updateDuration = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      // Track completion
      if (musicId) {
        interactionTracker.trackComplete(musicId, 'music', audio.currentTime);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      // Track play interaction (only once per session)
      if (musicId && !hasTrackedPlay) {
        interactionTracker.trackPlay(musicId, 'music');
        setHasTrackedPlay(true);
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      // Track pause interaction
      if (musicId) {
        interactionTracker.trackPause(musicId, 'music', audio.currentTime);
      }
    };

    const handleCanPlay = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
    };

    const handleLoadedData = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [music, musicId, hasTrackedPlay]);

  const loadMusic = async () => {
    const token = localStorage.getItem('access_token');
    const profileStr = localStorage.getItem('selected_profile');
    setLoading(true);

    try {
      // Fetch music data and watchlist in parallel
      const profile = profileStr ? JSON.parse(profileStr) : null;

      const [musicData] = await Promise.all([
        api.getMusicDetail(token, musicId),
      ]);

      setMusic(musicData);

      if (musicData.duration) {
        setDuration(musicData.duration);
      }

      // Start audio loading immediately after we have the URL
      if (audioRef.current && musicData.audio_url) {
        audioRef.current.src = musicData.audio_url;
        audioRef.current.load();
      }

      setLoading(false);

      // Check watchlist in background — don't block playback
      if (profile) {
        api.getWatchlist(token, profile.id)
          .then(watchlistData => {
            const isInList = watchlistData.some(item => item.music?.id === parseInt(musicId));
            setIsLiked(isInList);
          })
          .catch(() => { });
      }

      setIsPlaying(true);
      setTimeout(() => {
        audioRef.current?.play().catch(err => {
          console.error('Playback failed:', err);
          setIsPlaying(false);
        });
      }, 100);

    } catch (err) {
      console.error('Failed to load music', err);
      setLoading(false);
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(err => {
        console.error('Playback failed:', err);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;

    const audioDuration = audio.duration;

    if (!audioDuration || isNaN(audioDuration) || audioDuration === 0) {
      console.warn('Audio duration not ready yet');
      return;
    }

    const percent = parseFloat(e.target.value);
    const seekTime = (percent / 100) * audioDuration;
    const clampedSeekTime = Math.max(0, Math.min(seekTime, audioDuration));

    try {
      audio.currentTime = clampedSeekTime;
      setCurrentTime(clampedSeekTime);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const toggleLike = async () => {
    const token = localStorage.getItem('access_token');
    const profileStr = localStorage.getItem('selected_profile');

    if (!profileStr) {
      alert('Please select a profile first');
      return;
    }

    const profile = JSON.parse(profileStr);

    // Optimistically update UI
    const previousState = isLiked;
    setIsLiked(!isLiked);

    try {
      if (previousState) {
        // Remove from watchlist
        const result = await api.removeFromWatchlist(token, profile.id, null, musicId);
      } else {
        // Add to watchlist
        const result = await api.addToWatchlist(token, profile.id, null, musicId);
      }
    } catch (err) {
      console.error('Failed to toggle watchlist - Full error:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      // Revert on error
      setIsLiked(previousState);
      alert('Failed to update watchlist. Please try again.');
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    onClose();
  };

  if (!musicId) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl rounded-3xl max-w-lg w-full overflow-hidden border border-gray-700/50 shadow-2xl animate-scale-in">
        {loading ? (
          <div className="p-16 text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-400">Loading music...</p>
          </div>
        ) : music ? (
          <>
            <audio
              ref={audioRef}
              src={music.audio_url}
              preload="auto"
              crossOrigin="anonymous"
            />

            {/* Header */}
            <div className="p-6 pb-4 flex items-center justify-between border-b border-gray-700/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-400">Now Playing</span>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Album Art with Glow Effect */}
              <div className="relative mb-6">
                <div className={`absolute inset-0 bg-blue-500/20 blur-3xl rounded-full transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}></div>
                <div className="relative w-56 h-56 mx-auto rounded-2xl overflow-hidden shadow-2xl group">
                  {music.thumbnail ? (
                    <img
                      src={music.thumbnail}
                      alt={music.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 flex items-center justify-center">
                      <svg className="w-20 h-20 text-white/40" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                      </svg>
                    </div>
                  )}
                  {/* Play Overlay */}
                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isPlaying ? 'opacity-0' : 'opacity-100 group-hover:opacity-80'}`}>
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Song Info */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2 truncate px-4">{music.title}</h2>
                <p className="text-lg text-blue-400 mb-1">{music.artist}</p>
                {music.album && <p className="text-sm text-gray-500">{music.album}</p>}
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="relative h-2.5 bg-gray-600 rounded-full overflow-hidden group cursor-pointer mb-3 shadow-inner"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = ((e.clientX - rect.left) / rect.width) * 100;
                    handleSeek({ target: { value: percent } });
                  }}
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 rounded-full transition-all shadow-lg"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-2xl border-2 border-blue-400 scale-0 group-hover:scale-100 transition-transform"></div>
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-300 font-semibold">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls - All in One Line with Centered Playback */}
              <div className="flex items-center justify-center">
                {/* Like - Fixed Width */}
                <div className="w-32 flex justify-center">
                  <button
                    onClick={toggleLike}
                    className="text-gray-400 hover:text-white transition-all hover:scale-110"
                  >
                    <svg
                      className={`w-6 h-6 transition-colors ${isLiked ? 'text-red-500 fill-current' : ''}`}
                      fill={isLiked ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>

                {/* Playback Controls - Centered */}
                <div className="flex items-center gap-6">
                  <button className="text-gray-400 hover:text-white transition-all hover:scale-110">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                    </svg>
                  </button>

                  <button
                    onClick={togglePlay}
                    className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-full p-4 transition-all hover:scale-110 shadow-lg shadow-blue-500/50"
                  >
                    {isPlaying ? (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>

                  <button className="text-gray-400 hover:text-white transition-all hover:scale-110">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
                    </svg>
                  </button>
                </div>

                {/* Volume - Fixed Width */}
                <div className="w-32 flex justify-center items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    {volume > 50 ? (
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    ) : volume > 0 ? (
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.828 5.757a1 1 0 011.415 0A5.983 5.983 0 0116 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0014 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    )}
                  </svg>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer flex-shrink-0"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume}%, #374151 ${volume}%)`
                    }}
                    title={`Volume: ${Math.round(volume)}%`}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-16 text-center">
            <div className="inline-block p-6 bg-red-500/10 rounded-full mb-4">
              <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-400">Music not found</p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        input[type="range"]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}
