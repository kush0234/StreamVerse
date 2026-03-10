'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';

export default function MusicPlayerPage() {
  const router = useRouter();
  const params = useParams();
  const audioRef = useRef(null);
  const [music, setMusic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    loadMusic();
  }, [params.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [music]);

  const loadMusic = async () => {
    const token = localStorage.getItem('access_token');

    try {
      const musicData = await api.getMusicDetail(token, params.id);
      setMusic(musicData);
    } catch (err) {
      console.error('Failed to load music', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const seekTime = (e.target.value / 100) * duration;
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!music) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-xl">Music not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-black to-black text-white">
      <Navbar />
      
      <div className="pt-20 px-8 pb-32">
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 hover:text-gray-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        <div className="flex gap-8 items-start">
          {/* Album Art */}
          <div className="w-80 h-80 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg shadow-2xl flex-shrink-0">
            {music.thumbnail_url ? (
              <img src={music.thumbnail_url} alt={music.title} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">🎵</div>
            )}
          </div>

          {/* Music Info */}
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-2">SONG</p>
            <h1 className="text-6xl font-bold mb-4">{music.title}</h1>
            <p className="text-2xl text-gray-300 mb-2">{music.artist}</p>
            {music.album && <p className="text-lg text-gray-400 mb-4">{music.album}</p>}
            <div className="flex gap-4 text-sm text-gray-400">
              <span>{music.genre}</span>
              <span>•</span>
              <span>{music.release_date}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Player Controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-6">
        <audio ref={audioRef} src={music.audio_url} />
        
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max="100"
              value={duration ? (currentTime / duration) * 100 : 0}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6">
            <button className="text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
              </svg>
            </button>

            <button
              onClick={togglePlay}
              className="bg-white text-black rounded-full p-4 hover:scale-105 transition"
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

            <button className="text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
