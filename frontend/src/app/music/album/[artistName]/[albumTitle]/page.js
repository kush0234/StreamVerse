'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import MusicPlayer from '@/components/MusicPlayer';
import LoadingSkeleton from '@/components/LoadingSkeleton';

export default function AlbumDetailPage() {
  const router = useRouter();
  const params = useParams();
  const artistName = decodeURIComponent(params.artistName);
  const albumTitle = decodeURIComponent(params.albumTitle);
  
  const [loading, setLoading] = useState(true);
  const [albumData, setAlbumData] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [selectedMusicId, setSelectedMusicId] = useState(null);
  const [likedSongs, setLikedSongs] = useState([]);

  useEffect(() => {
    const profile = localStorage.getItem('selected_profile');
    if (!profile) {
      router.push('/profiles');
      return;
    }
    loadAlbumData();

    // Set up global function for opening music player
    window.openMusicPlayer = (musicId) => {
      setSelectedMusicId(musicId);
    };

    return () => {
      delete window.openMusicPlayer;
    };
  }, [artistName, albumTitle, router]);

  const loadAlbumData = async () => {
    const token = localStorage.getItem('access_token');
    const profileStr = localStorage.getItem('selected_profile');
    setLoading(true);

    try {
      const data = await api.getAlbumDetail(token, artistName, albumTitle);
      setAlbumData(data.album);
      setTracks(data.tracks);

      // Load watchlist to check liked songs
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        const watchlistData = await api.getWatchlist(token, profile.id);
        const likedMusicIds = watchlistData
          .filter(item => item.music)
          .map(item => item.music.id);
        setLikedSongs(likedMusicIds);
      }
    } catch (err) {
      console.error('Failed to load album data', err);
      router.push('/music');
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (musicId) => {
    const token = localStorage.getItem('access_token');
    const profileStr = localStorage.getItem('selected_profile');

    if (!profileStr) {
      alert('Please select a profile first');
      return;
    }

    const profile = JSON.parse(profileStr);
    const isLiked = likedSongs.includes(musicId);

    // Optimistically update UI
    if (isLiked) {
      setLikedSongs(likedSongs.filter(id => id !== musicId));
    } else {
      setLikedSongs([...likedSongs, musicId]);
    }

    try {
      if (isLiked) {
        await api.removeFromWatchlist(token, profile.id, null, musicId);
      } else {
        await api.addToWatchlist(token, profile.id, null, musicId);
      }
    } catch (err) {
      console.error('Failed to toggle watchlist', err);
      // Revert on error
      if (isLiked) {
        setLikedSongs([...likedSongs, musicId]);
      } else {
        setLikedSongs(likedSongs.filter(id => id !== musicId));
      }
      alert('Failed to update watchlist. Please try again.');
    }
  };
  const handlePlayAll = () => {
    if (tracks.length > 0) {
      setSelectedMusicId(tracks[0].id);
    }
  };

  const handleArtistClick = () => {
    router.push(`/music/artist/${encodeURIComponent(artistName)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-20 px-8 py-12">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  if (!albumData) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-20 px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Album Not Found</h1>
            <button
              onClick={() => router.push('/music')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full font-semibold transition"
            >
              Back to Music
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="pt-20 px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/music')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Music
        </button>

        {/* Album Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="w-64 h-64 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 mx-auto md:mx-0 shadow-2xl">
            {albumData.thumbnail ? (
              <img
                src={albumData.thumbnail}
                alt={albumData.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600">
                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            <p className="text-sm text-gray-400 mb-2">ALBUM</p>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">{albumData.title}</h1>
            
            <button
              onClick={handleArtistClick}
              className="text-xl text-gray-300 hover:text-white transition mb-4 hover:underline"
            >
              {albumData.artist}
            </button>
            
            <div className="flex flex-wrap gap-4 justify-center md:justify-start text-gray-400 mb-6">
              <span>{new Date(albumData.release_date).getFullYear()}</span>
              <span>•</span>
              <span>{albumData.track_count} tracks</span>
              <span>•</span>
              <span>{albumData.total_duration_formatted}</span>
            </div>

            <div className="flex gap-4 justify-center md:justify-start">
              <button
                onClick={handlePlayAll}
                disabled={tracks.length === 0}
                className="flex items-center gap-3 bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-full font-semibold transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
                Play Album
              </button>
            </div>
          </div>
        </div>
        {/* Tracks Section */}
        <div className="mb-8">
          {tracks.length > 0 ? (
            <div className="bg-gray-900/30 rounded-xl p-6">
              {/* Table Header */}
              <div className="flex items-center gap-4 px-3 pb-3 mb-2 border-b border-gray-800 text-sm text-gray-400 font-medium">
                <div className="w-8 text-center">#</div>
                <div className="w-14"></div>
                <div className="flex-1 min-w-0">TITLE</div>
                <div className="w-16 text-right">TIME</div>
                <div className="w-28"></div>
              </div>

              <div className="space-y-2">
                {tracks.map((track, index) => (
                  <div
                    key={track.id}
                    className="group flex items-center gap-4 p-3 rounded-lg hover:bg-gray-800/50 transition cursor-pointer"
                    onClick={() => setSelectedMusicId(track.id)}
                  >
                    {/* Number */}
                    <div className="w-8 text-center text-gray-400 font-semibold">
                      {index + 1}
                    </div>

                    {/* Thumbnail */}
                    <div className="relative w-14 h-14 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                      {track.thumbnail ? (
                        <img
                          src={track.thumbnail}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate group-hover:text-purple-400 transition">
                        {track.title}
                      </h3>
                      <p className="text-sm text-gray-400 truncate">{track.play_count} plays</p>
                    </div>

                    {/* Duration */}
                    <div className="text-sm text-gray-400 w-16 text-right">
                      {track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '0:00'}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 w-28 justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(track.id);
                        }}
                        className="p-2 hover:bg-gray-700 rounded-full transition"
                      >
                        <svg
                          className={`w-5 h-5 ${likedSongs.includes(track.id) ? 'text-purple-500 fill-current' : 'text-gray-400'}`}
                          fill={likedSongs.includes(track.id) ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="inline-block p-8 bg-gray-900 rounded-full mb-6">
                <svg className="w-20 h-20 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
          </div>
          <p className="text-gray-400 text-xl">No tracks found</p>
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