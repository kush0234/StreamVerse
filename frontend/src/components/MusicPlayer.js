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
  const [isLiked, setIsLiked] = useState(false);
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false);

  useEffect(() => { if (musicId) loadMusic(); }, [musicId]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      const audio = audioRef.current;
      if (!audio) return;
      switch (e.key) {
        case ' ': e.preventDefault(); togglePlay(); break;
        case 'ArrowLeft': e.preventDefault(); audio.currentTime = Math.max(0, audio.currentTime - 10); break;
        case 'ArrowRight': e.preventDefault(); audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10); break;
        case 'Escape': e.preventDefault(); handleClose(); break;
        default: break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [music, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onDur = () => { if (audio.duration && !isNaN(audio.duration)) setDuration(audio.duration); };
    const onEnded = () => { setIsPlaying(false); if (musicId) interactionTracker.trackComplete(musicId, 'music', audio.currentTime); };
    const onPlay = () => { setIsPlaying(true); if (musicId && !hasTrackedPlay) { interactionTracker.trackPlay(musicId, 'music'); setHasTrackedPlay(true); } };
    const onPause = () => { setIsPlaying(false); if (musicId) interactionTracker.trackPause(musicId, 'music', audio.currentTime); };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onDur);
    audio.addEventListener('durationchange', onDur);
    audio.addEventListener('canplay', onDur);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onDur);
      audio.removeEventListener('durationchange', onDur);
      audio.removeEventListener('canplay', onDur);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [music, musicId, hasTrackedPlay]);

  const loadMusic = async () => {
    const token = localStorage.getItem('access_token');
    const profileStr = localStorage.getItem('selected_profile');
    setLoading(true);
    try {
      const musicData = await api.getMusicDetail(token, musicId);
      setMusic(musicData);
      if (musicData.duration) setDuration(musicData.duration);
      if (audioRef.current && musicData.audio_url) {
        audioRef.current.src = musicData.audio_url;
        audioRef.current.load();
      }
      setLoading(false);
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        api.getWatchlist(token, profile.id).then(wl => {
          setIsLiked(wl.some(i => i.music?.id === parseInt(musicId)));
        }).catch(() => { });
      }
      setIsPlaying(true);
      setTimeout(() => audioRef.current?.play().catch(() => setIsPlaying(false)), 100);
    } catch (err) {
      console.error('Failed to load music', err);
      setLoading(false);
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    isPlaying ? audio.pause() : audio.play().catch(() => setIsPlaying(false));
  };

  const handleSeek = (pct) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration || isNaN(audio.duration)) return;
    audio.currentTime = Math.max(0, Math.min((pct / 100) * audio.duration, audio.duration));
    setCurrentTime(audio.currentTime);
  };

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v / 100;
  };

  const toggleLike = async () => {
    const token = localStorage.getItem('access_token');
    const profileStr = localStorage.getItem('selected_profile');
    if (!profileStr) return;
    const profile = JSON.parse(profileStr);
    const prev = isLiked;
    setIsLiked(!prev);
    try {
      prev ? await api.removeFromWatchlist(token, profile.id, null, musicId) : await api.addToWatchlist(token, profile.id, null, musicId);
    } catch { setIsLiked(prev); }
  };

  const handleClose = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setIsPlaying(false);
    onClose();
  };

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!musicId) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={handleClose} />

      <div className="relative bg-gradient-to-b from-gray-900 to-black w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-gray-600 rounded-full" />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-400 text-sm">Loading...</p>
          </div>
        ) : music ? (
          <div className="px-6 pb-8 pt-2">
            <audio ref={audioRef} src={music.audio_url} preload="auto" crossOrigin="anonymous" />

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-400 font-medium">Now Playing</span>
              </div>
              <button onClick={handleClose} className="p-1.5 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Album art */}
            <div className="relative mb-5">
              <div className={`absolute inset-0 bg-blue-500/20 blur-3xl rounded-full transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />
              <div className="relative w-44 h-44 sm:w-52 sm:h-52 mx-auto rounded-2xl overflow-hidden shadow-2xl">
                {music.thumbnail ? (
                  <img src={music.thumbnail} alt={music.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
                    <svg className="w-16 h-16 text-white/40" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Song info */}
            <div className="text-center mb-5">
              <h2 className="text-lg sm:text-xl font-bold truncate">{music.title}</h2>
              <p className="text-blue-400 text-sm mt-0.5">{music.artist}</p>
              {music.album && <p className="text-gray-500 text-xs mt-0.5">{music.album}</p>}
            </div>

            {/* Progress */}
            <div className="mb-5">
              <div
                className="relative h-2 bg-gray-700 rounded-full cursor-pointer group mb-2"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  handleSeek(((e.clientX - rect.left) / rect.width) * 100);
                }}
              >
                <div className="absolute inset-y-0 left-0 bg-blue-500 rounded-full transition-all" style={{ width: `${progressPct}%` }}>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow scale-0 group-hover:scale-100 transition-transform" />
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{fmt(currentTime)}</span>
                <span>{fmt(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mb-5">
              {/* Like */}
              <button onClick={toggleLike} className="p-2 text-gray-400 hover:text-white transition">
                <svg className={`w-6 h-6 ${isLiked ? 'text-red-500' : ''}`} fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>

              {/* Prev / Play / Next */}
              <div className="flex items-center gap-4">
                <button className="p-2 text-gray-400 hover:text-white transition">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                  </svg>
                </button>
                <button
                  onClick={togglePlay}
                  className="w-14 h-14 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40 transition hover:scale-105 active:scale-95"
                >
                  {isPlaying ? (
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <button className="p-2 text-gray-400 hover:text-white transition">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
                  </svg>
                </button>
              </div>

              {/* Volume — icon only on mobile, slider on sm+ */}
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
                <input
                  type="range" min="0" max="100" value={volume}
                  onChange={handleVolumeChange}
                  className="hidden sm:block w-20 h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #3b82f6 ${volume}%, #374151 ${volume}%)` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center text-gray-400 px-6">
            <p>Music not found</p>
          </div>
        )}
      </div>
    </div>
  );
}
