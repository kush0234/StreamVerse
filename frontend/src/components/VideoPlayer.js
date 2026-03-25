'use client';
import { useEffect, useRef, useState } from 'react';
import interactionTracker from '@/lib/interactionTracker';

// Tooltip with keyboard shortcut badge
function Tooltip({ label, shortcut, children }) {
  return (
    <div className="relative group/tip">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50">
        <div className="bg-gray-900/95 backdrop-blur-sm border border-white/10 text-white text-xs rounded-lg px-2.5 py-1.5 shadow-xl whitespace-nowrap flex items-center gap-2">
          <span>{label}</span>
          {shortcut && (
            <span className="bg-white/15 text-white/70 px-1.5 py-0.5 rounded text-[10px] font-mono">{shortcut}</span>
          )}
        </div>
        <div className="w-2 h-2 bg-gray-900/95 border-r border-b border-white/10 rotate-45 mx-auto -mt-1" />
      </div>
    </div>
  );
}

export default function VideoPlayer({ videoData, onTimeUpdate: onTimeUpdateProp, onEnded: onEndedProp }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hoverTime, setHoverTime] = useState(null);
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRemaining, setShowRemaining] = useState(false);

  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // Sync video events to state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (onTimeUpdateProp) onTimeUpdateProp(video.currentTime);
    };
    const onLoaded = () => {
      if (isFinite(video.duration)) setDuration(video.duration);
    };
    const onPlay = () => {
      setIsPlaying(true);
      if (videoData?.id && !hasTrackedPlay) {
        interactionTracker.trackPlay(videoData.id, 'video');
        setHasTrackedPlay(true);
      }
    };
    const onPause = () => {
      setIsPlaying(false);
      if (videoData?.id) interactionTracker.trackPause(videoData.id, 'video', video.currentTime);
    };
    const onEnded = () => {
      setIsPlaying(false);
      if (videoData?.id) interactionTracker.trackComplete(videoData.id, 'video', video.currentTime);
      if (onEndedProp) onEndedProp();
    };
    const onVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('volumechange', onVolumeChange);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('volumechange', onVolumeChange);
    };
  }, [videoData?.id, hasTrackedPlay]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (!videoRef.current) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const keys = ['Space', 'KeyK', 'KeyF', 'KeyM', 'KeyP', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
      if (keys.includes(e.code)) e.preventDefault();
      switch (e.code) {
        case 'Space': case 'KeyK': togglePlay(); break;
        case 'KeyF': toggleFullscreen(); break;
        case 'KeyM': toggleMute(); break;
        case 'KeyP': togglePiP(); break;
        case 'ArrowLeft': seek(-10); break;
        case 'ArrowRight': seek(10); break;
        case 'ArrowUp': adjustVolume(0.1); break;
        case 'ArrowDown': adjustVolume(-0.1); break;
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

  // Controls auto-hide
  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying) setShowControls(false);
  };

  // Playback controls
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  };

  const seek = (seconds) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.currentTime + seconds, duration));
  };

  const handleSeek = (e) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const adjustVolume = (delta) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = Math.max(0, Math.min(1, v.volume + delta));
    if (v.volume > 0) v.muted = false;
  };

  const handleVolumeSlider = (e) => {
    const v = videoRef.current;
    if (!v) return;
    const val = parseFloat(e.target.value);
    v.volume = val;
    v.muted = val === 0;
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
  };

  const changeSpeed = (speed) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  };

  const togglePiP = async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      document.pictureInPictureElement
        ? await document.exitPictureInPicture()
        : await v.requestPictureInPicture();
    } catch (e) { console.error(e); }
  };

  const toggleFullscreen = async () => {
    const c = containerRef.current;
    if (!c) return;
    try {
      document.fullscreenElement
        ? await document.exitFullscreen()
        : await c.requestFullscreen();
    } catch (e) { console.error(e); }
  };

  const formatTime = (s) => {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumeVal = isMuted ? 0 : volume;

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

  // Cloudinary video player
  if (videoData.video_url) {
    return (
      <div
        ref={containerRef}
        className="relative w-full bg-black rounded-lg overflow-hidden"
        style={{ aspectRatio: '16/9' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Video */}
        <video
          ref={videoRef}
          src={videoData.video_url}
          poster={videoData.thumbnail}
          className="absolute inset-0 w-full h-full object-contain"
          preload="metadata"
          onClick={togglePlay}
        />

        {/* Play overlay when paused */}
        {!isPlaying && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
            onClick={togglePlay}
          >
            <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center hover:scale-110 transition-transform">
              <svg className="w-10 h-10 text-black ml-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </div>
        )}

        {/* Controls bar — slide up on show */}
        <div
          className={`absolute bottom-0 left-0 right-0 px-4 pt-10 pb-3 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
            }`}
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)' }}
        >
          {/* Progress bar */}
          <div
            className="relative w-full cursor-pointer mb-3 group"
            style={{ height: '4px' }}
            onClick={handleSeek}
            onMouseMove={(e) => {
              if (!duration) return;
              const rect = e.currentTarget.getBoundingClientRect();
              setHoverTime(((e.clientX - rect.left) / rect.width) * duration);
            }}
            onMouseLeave={() => setHoverTime(null)}
          >
            {/* Track */}
            <div className="absolute inset-0 rounded-full bg-white/20 group-hover:scale-y-150 transition-transform origin-bottom" />
            {/* Played */}
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-red-500 group-hover:scale-y-150 transition-transform origin-bottom"
              style={{ width: `${progressPct}%` }}
            />
            {/* Near-end red dot indicator */}
            {duration > 0 && progressPct >= 90 && (
              <div
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-400 animate-pulse"
                style={{ left: '90%' }}
              />
            )}
            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2"
              style={{ left: `${progressPct}%` }}
            />
            {/* Hover tooltip */}
            {hoverTime !== null && (
              <div
                className="absolute bottom-full mb-3 -translate-x-1/2 pointer-events-none"
                style={{ left: `${(hoverTime / duration) * 100}%` }}
              >
                <div className="bg-gray-900/95 backdrop-blur-sm border border-white/10 text-white text-xs font-medium px-2.5 py-1 rounded-md shadow-xl whitespace-nowrap">
                  {formatTime(hoverTime)}
                </div>
              </div>
            )}
          </div>

          {/* Frosted glass control bar */}
          <div className="flex items-center justify-between bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2">
            {/* Left controls */}
            <div className="flex items-center gap-1">

              {/* Play/Pause */}
              <Tooltip label={isPlaying ? 'Pause' : 'Play'} shortcut="Space">
                <button
                  onClick={togglePlay}
                  className="p-2 rounded-lg text-white hover:bg-white/15 hover:text-red-400 transition-all active:scale-90"
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
              </Tooltip>

              {/* Skip -10 */}
              <Tooltip label="Rewind 10s" shortcut="←">
                <button onClick={() => seek(-10)} className="p-2 rounded-lg text-white hover:bg-white/15 hover:text-red-400 transition-all active:scale-90">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                  </svg>
                </button>
              </Tooltip>

              {/* Skip +10 */}
              <Tooltip label="Forward 10s" shortcut="→">
                <button onClick={() => seek(10)} className="p-2 rounded-lg text-white hover:bg-white/15 hover:text-red-400 transition-all active:scale-90">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                  </svg>
                </button>
              </Tooltip>

              {/* Volume */}
              <div className="flex items-center gap-1.5 group/vol">
                <Tooltip label={isMuted || volume === 0 ? 'Unmute' : 'Mute'} shortcut="M">
                  <button onClick={toggleMute} className="p-2 rounded-lg text-white hover:bg-white/15 hover:text-red-400 transition-all active:scale-90">
                    {isMuted || volume === 0 ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    ) : volume < 0.5 ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.828 11.828a1 1 0 001.415 0A3.983 3.983 0 0015 10a3.983 3.983 0 00-1.172-2.828 1 1 0 00-1.415 1.415A1.984 1.984 0 0113 10c0 .551-.224 1.05-.586 1.414a1 1 0 000 1.414z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </Tooltip>
                <input
                  type="range" min="0" max="1" step="0.01"
                  value={volumeVal}
                  onChange={handleVolumeSlider}
                  className="w-0 group-hover/vol:w-20 overflow-hidden transition-all duration-300 h-1 rounded-lg appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #ef4444 ${volumeVal * 100}%, rgba(255,255,255,0.2) ${volumeVal * 100}%)` }}
                />
              </div>

              {/* Time — click to toggle remaining */}
              <button
                onClick={() => setShowRemaining(p => !p)}
                className="px-2 py-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 text-xs font-mono tabular-nums transition-all"
              >
                {showRemaining
                  ? `-${formatTime(duration - currentTime)}`
                  : `${formatTime(currentTime)} / ${formatTime(duration)}`
                }
              </button>

              {/* Near-end live dot */}
              {duration > 0 && progressPct >= 90 && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-red-600/80 rounded-full">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  <span className="text-white text-xs font-semibold">ENDING</span>
                </div>
              )}
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-1">
              {/* Speed */}
              <div className="relative">
                <Tooltip label="Playback speed">
                  <button
                    onClick={() => setShowSpeedMenu(p => !p)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-white/15 ${playbackSpeed !== 1 ? 'text-red-400 bg-red-500/10' : 'text-white'
                      }`}
                  >
                    {playbackSpeed === 1 ? '1x' : `${playbackSpeed}x`}
                  </button>
                </Tooltip>
                {showSpeedMenu && (
                  <div className="absolute bottom-full mb-2 right-0 bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-xl py-1.5 min-w-[90px] shadow-2xl">
                    {speedOptions.map(s => (
                      <button
                        key={s}
                        onClick={() => changeSpeed(s)}
                        className={`w-full px-3 py-1.5 text-sm text-left hover:bg-white/10 transition-colors flex items-center justify-between gap-3 ${playbackSpeed === s ? 'text-red-400 font-semibold' : 'text-white/80'
                          }`}
                      >
                        <span>{s === 1 ? 'Normal' : `${s}x`}</span>
                        {playbackSpeed === s && <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* PiP */}
              <Tooltip label="Picture in Picture" shortcut="P">
                <button onClick={togglePiP} className="p-2 rounded-lg text-white hover:bg-white/15 hover:text-red-400 transition-all active:scale-90">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10h4.5a.5.5 0 01.5.5v5a.5.5 0 01-.5.5H15a.5.5 0 01-.5-.5v-5a.5.5 0 01.5-.5zM3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
                  </svg>
                </button>
              </Tooltip>

              {/* Fullscreen */}
              <Tooltip label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'} shortcut="F">
                <button onClick={toggleFullscreen} className="p-2 rounded-lg text-white hover:bg-white/15 hover:text-red-400 transition-all active:scale-90">
                  {isFullscreen ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 15v4.5M9 15H4.5M15 9h4.5M15 9V4.5M15 15h4.5M15 15v4.5" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  )}
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No video
  return (
    <div className="w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <p className="text-gray-400">No video available</p>
      </div>
    </div>
  );
}
