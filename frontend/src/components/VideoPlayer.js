'use client';
import { useEffect, useRef, useState } from 'react';
import interactionTracker from '@/lib/interactionTracker';

export default function VideoPlayer({ videoData, onTimeUpdate: onTimeUpdateProp, onEnded: onEndedProp }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hideTimer = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false);

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  // Video events
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => { setCurrentTime(v.currentTime); if (onTimeUpdateProp) onTimeUpdateProp(v.currentTime); };
    const onLoad = () => { if (isFinite(v.duration)) setDuration(v.duration); };
    const onPlay = () => { setIsPlaying(true); if (videoData?.id && !hasTrackedPlay) { interactionTracker.trackPlay(videoData.id, 'video'); setHasTrackedPlay(true); } };
    const onPause = () => { setIsPlaying(false); if (videoData?.id) interactionTracker.trackPause(videoData.id, 'video', v.currentTime); };
    const onEnded = () => { setIsPlaying(false); if (videoData?.id) interactionTracker.trackComplete(videoData.id, 'video', v.currentTime); if (onEndedProp) onEndedProp(); };
    const onVol = () => { setVolume(v.volume); setIsMuted(v.muted); };
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onLoad);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('ended', onEnded);
    v.addEventListener('volumechange', onVol);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onLoad);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('ended', onEnded);
      v.removeEventListener('volumechange', onVol);
    };
  }, [videoData?.id, hasTrackedPlay]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (!videoRef.current) return;
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      switch (e.code) {
        case 'Space': case 'KeyK': e.preventDefault(); togglePlay(); break;
        case 'KeyF': e.preventDefault(); toggleFullscreen(); break;
        case 'KeyM': e.preventDefault(); toggleMute(); break;
        case 'ArrowLeft': e.preventDefault(); seek(-10); break;
        case 'ArrowRight': e.preventDefault(); seek(10); break;
        default: break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [duration]);

  // Fullscreen detection
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const showControlsTemporarily = () => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    if (isPlaying) hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  };

  const togglePlay = () => { const v = videoRef.current; if (!v) return; v.paused ? v.play() : v.pause(); };
  const seek = (s) => { const v = videoRef.current; if (!v) return; v.currentTime = Math.max(0, Math.min(v.currentTime + s, duration)); };
  const toggleMute = () => { const v = videoRef.current; if (!v) return; v.muted = !v.muted; };
  const toggleFullscreen = async () => {
    const c = containerRef.current;
    if (!c) return;
    try { document.fullscreenElement ? await document.exitFullscreen() : await c.requestFullscreen(); } catch (e) { }
  };

  const handleSeekClick = (e) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const fmt = (s) => {
    if (!isFinite(s)) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volVal = isMuted ? 0 : volume;

  // YouTube embed
  if (videoData.video_url && (videoData.video_url.includes('youtube.com') || videoData.video_url.includes('youtu.be'))) {
    return (
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          src={videoData.video_url}
          title={videoData.title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (!videoData.video_url) {
    return (
      <div className="w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-400 text-sm">No video available</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black rounded-lg overflow-hidden select-none"
      style={{ aspectRatio: '16/9' }}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => { if (isPlaying) setShowControls(false); }}
      onTouchStart={showControlsTemporarily}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={videoData.video_url}
        poster={videoData.thumbnail}
        className="absolute inset-0 w-full h-full object-contain"
        preload="metadata"
        onClick={togglePlay}
        playsInline
      />

      {/* Big play button when paused */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer" onClick={togglePlay}>
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/90 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-2xl">
            <svg className="w-7 h-7 sm:w-9 sm:h-9 text-black ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'}`}
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)' }}
      >
        {/* Progress bar */}
        <div
          className="relative mx-3 sm:mx-4 mb-2 cursor-pointer group"
          style={{ height: '4px', marginTop: '12px' }}
          onClick={handleSeekClick}
        >
          <div className="absolute inset-0 rounded-full bg-white/25 group-hover:scale-y-150 transition-transform origin-bottom" />
          <div className="absolute left-0 top-0 h-full rounded-full bg-red-500 group-hover:scale-y-150 transition-transform origin-bottom" style={{ width: `${pct}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `${pct}%` }} />
        </div>

        {/* Button row */}
        <div className="flex items-center justify-between px-1 sm:px-3 pb-2 sm:pb-3">
          {/* Left */}
          <div className="flex items-center gap-0 sm:gap-1 min-w-0">
            {/* Play/Pause */}
            <button onClick={togglePlay} className="p-1.5 sm:p-2 text-white hover:text-red-400 transition active:scale-90">
              {isPlaying ? (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Rewind */}
            <button onClick={() => seek(-10)} className="p-1.5 sm:p-2 text-white hover:text-red-400 transition active:scale-90">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              </svg>
            </button>

            {/* Forward */}
            <button onClick={() => seek(10)} className="p-1.5 sm:p-2 text-white hover:text-red-400 transition active:scale-90">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
              </svg>
            </button>

            {/* Mute */}
            <button onClick={toggleMute} className="p-1.5 sm:p-2 text-white hover:text-red-400 transition active:scale-90">
              {isMuted || volume === 0 ? (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Volume slider — hidden on mobile */}
            <input
              type="range" min="0" max="1" step="0.05"
              value={volVal}
              onChange={(e) => { const v = videoRef.current; if (!v) return; v.volume = parseFloat(e.target.value); v.muted = parseFloat(e.target.value) === 0; }}
              className="hidden sm:block w-16 md:w-20 h-1 rounded-lg appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, #ef4444 ${volVal * 100}%, rgba(255,255,255,0.2) ${volVal * 100}%)` }}
            />

            {/* Time */}
            <span className="text-white/80 text-xs font-mono ml-1 whitespace-nowrap hidden xs:inline">
              {fmt(currentTime)} / {fmt(duration)}
            </span>
            <span className="text-white/80 text-xs font-mono ml-1 whitespace-nowrap xs:hidden">
              {fmt(currentTime)}
            </span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-0 sm:gap-1 flex-shrink-0">
            {/* Speed */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(p => !p)}
                className={`px-2 py-1 rounded text-xs font-semibold transition hover:bg-white/15 ${playbackSpeed !== 1 ? 'text-red-400' : 'text-white'}`}
              >
                {playbackSpeed === 1 ? '1×' : `${playbackSpeed}×`}
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full mb-2 right-0 bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-xl py-1 min-w-[80px] shadow-2xl z-10">
                  {speeds.map(s => (
                    <button
                      key={s}
                      onClick={() => { const v = videoRef.current; if (v) v.playbackRate = s; setPlaybackSpeed(s); setShowSpeedMenu(false); }}
                      className={`w-full px-3 py-1.5 text-xs text-left hover:bg-white/10 transition flex items-center justify-between ${playbackSpeed === s ? 'text-red-400 font-semibold' : 'text-white/80'}`}
                    >
                      {s === 1 ? 'Normal' : `${s}×`}
                      {playbackSpeed === s && <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="p-1.5 sm:p-2 text-white hover:text-red-400 transition active:scale-90">
              {isFullscreen ? (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 15v4.5M9 15H4.5M15 9h4.5M15 9V4.5M15 15h4.5M15 15v4.5" />
                </svg>
              ) : (
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
