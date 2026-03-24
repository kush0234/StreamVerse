'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import MusicPlayer from '@/components/MusicPlayer';
import LoadingSkeleton from '@/components/LoadingSkeleton';

export default function MusicPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allMusic, setAllMusic] = useState([]);
  const [filteredMusic, setFilteredMusic] = useState([]);
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [selectedMusicId, setSelectedMusicId] = useState(null);
  const [activeTab, setActiveTab] = useState('Songs');
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [likedSongs, setLikedSongs] = useState([]);

  useEffect(() => {
    const profile = localStorage.getItem('selected_profile');
    if (!profile) {
      router.push('/profiles');
      return;
    }
    loadData();

    // Set up global function for opening music player
    window.openMusicPlayer = (musicId) => {
      setSelectedMusicId(musicId);
    };

    return () => {
      delete window.openMusicPlayer;
    };
  }, [router]);

  useEffect(() => {
    filterContent();
  }, [selectedGenre, searchQuery, allMusic, artists, albums, activeTab]);

  const loadData = async () => {
    const token = localStorage.getItem('access_token');
    const profileStr = localStorage.getItem('selected_profile');
    setLoading(true);

    try {
      // Load music data
      const musicData = await api.getMusic(token);
      setAllMusic(musicData);
      setFilteredMusic(musicData);

      // Load artists and albums
      const [artistsData, albumsData] = await Promise.all([
        api.getArtists(token),
        api.getAlbums(token)
      ]);
      setArtists(artistsData);
      setAlbums(albumsData);
      // Extract unique genres
      const uniqueGenres = [...new Set(musicData.map(m => m.genre))].filter(Boolean);
      setGenres(uniqueGenres);

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
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  const filterContent = () => {
    if (activeTab === 'Songs') {
      let music = [...allMusic];

      // Filter by search query
      if (searchQuery) {
        music = music.filter(m =>
          m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.album && m.album.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }

      // Filter by genre
      if (selectedGenre !== 'All') {
        music = music.filter(m => m.genre === selectedGenre);
      }

      setFilteredMusic(music);
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
    if (filteredMusic.length > 0) {
      setSelectedMusicId(filteredMusic[0].id);
    }
  };

  const getFilteredArtists = () => {
    let filteredArtists = [...artists];

    if (searchQuery) {
      filteredArtists = filteredArtists.filter(artist =>
        artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artist.genres.some(genre => genre.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedGenre !== 'All') {
      filteredArtists = filteredArtists.filter(artist =>
        artist.genres.includes(selectedGenre)
      );
    }

    return filteredArtists;
  };

  const getFilteredAlbums = () => {
    let filteredAlbums = [...albums];

    if (searchQuery) {
      filteredAlbums = filteredAlbums.filter(album =>
        album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        album.artist.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filteredAlbums;
  };

  const handleArtistClick = (artistName) => {
    router.push(`/music/artist/${encodeURIComponent(artistName)}`);
  };

  const handleAlbumClick = (artistName, albumTitle) => {
    router.push(`/music/album/${encodeURIComponent(artistName)}/${encodeURIComponent(albumTitle)}`);
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
  const renderContent = () => {
    if (activeTab === 'Songs') {
      return renderSongs();
    } else if (activeTab === 'Artists') {
      return renderArtists();
    } else if (activeTab === 'Albums') {
      return renderAlbums();
    }
  };

  const renderSongs = () => (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handlePlayAll}
          disabled={filteredMusic.length === 0}
          className="flex items-center gap-3 bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-full font-semibold transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
          Shuffle All
        </button>
      </div>

      {/* Results Count */}
      <p className="text-gray-400">{filteredMusic.length} Songs</p>

      {/* Music List */}
      {filteredMusic.length > 0 ? (
        <div className="bg-gray-900/30 rounded-xl p-6">
          {/* Table Header */}
          <div className="flex items-center gap-4 px-3 pb-3 mb-2 border-b border-gray-800 text-sm text-gray-400 font-medium">
            <div className="w-8 text-center">#</div>
            <div className="w-14"></div>
            <div className="flex-1 min-w-0">TITLE</div>
            <div className="hidden md:block w-48 truncate">ALBUM</div>
            <div className="hidden lg:block w-32">GENRE</div>
            <div className="w-16 text-right">TIME</div>
            <div className="w-28"></div>
          </div>

          <div className="space-y-2">
            {filteredMusic.map((music, index) => (
              <div
                key={music.id}
                className="group flex items-center gap-4 p-3 rounded-lg hover:bg-gray-800/50 transition cursor-pointer"
                onClick={() => setSelectedMusicId(music.id)}
              >
                {/* Number */}
                <div className="w-8 text-center text-gray-400 font-semibold">
                  {index + 1}
                </div>
                {/* Thumbnail */}
                <div className="relative w-14 h-14 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                  {music.thumbnail ? (
                    <img
                      src={music.thumbnail}
                      alt={music.title}
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
                    {music.title}
                  </h3>
                  <p className="text-sm text-gray-400 truncate">{music.artist}</p>
                </div>

                {/* Album */}
                {music.album && (
                  <div className="hidden md:block text-sm text-gray-400 w-48 truncate">
                    {music.album}
                  </div>
                )}
                {!music.album && <div className="hidden md:block w-48"></div>}

                {/* Genre */}
                <div className="hidden lg:block w-32">
                  <span className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-300 inline-block">
                    {music.genre}
                  </span>
                </div>

                {/* Duration */}
                <div className="text-sm text-gray-400 w-16 text-right">
                  {music.duration ? `${Math.floor(music.duration / 60)}:${(music.duration % 60).toString().padStart(2, '0')}` : '0:00'}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 w-28 justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(music.id);
                    }}
                    className="p-2 hover:bg-gray-700 rounded-full transition"
                  >
                    <svg
                      className={`w-5 h-5 ${likedSongs.includes(music.id) ? 'text-purple-500 fill-current' : 'text-gray-400'}`}
                      fill={likedSongs.includes(music.id) ? 'currentColor' : 'none'}
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
          <p className="text-gray-400 text-xl">No music found</p>
          <p className="text-gray-500 mt-2">Try adjusting your filters or search query</p>
        </div>
      )}
    </div>
  );
  const renderArtists = () => {
    const filteredArtists = getFilteredArtists();

    return (
      <div className="space-y-6">
        <p className="text-gray-400">{filteredArtists.length} Artists</p>

        {filteredArtists.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {filteredArtists.map((artist) => (
              <div
                key={artist.name}
                className="group bg-gray-900/30 p-4 rounded-xl hover:bg-gray-800/50 transition cursor-pointer"
                onClick={() => handleArtistClick(artist.name)}
              >
                <div className="relative w-full aspect-square bg-gray-800 rounded-full overflow-hidden mb-4">
                  {artist.thumbnail ? (
                    <img
                      src={artist.thumbnail}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                </div>

                <h3 className="font-semibold text-white truncate mb-2 group-hover:text-purple-400 transition text-center">
                  {artist.name}
                </h3>

                <div className="text-center space-y-1">
                  <p className="text-sm text-gray-400">{artist.track_count} tracks</p>
                  <p className="text-sm text-gray-400">{artist.total_plays} plays</p>
                  {artist.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-center mt-2">
                      {artist.genres.slice(0, 2).map((genre) => (
                        <span key={genre} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">
                          {genre}
                        </span>
                      ))}
                      {artist.genres.length > 2 && (
                        <span className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">
                          +{artist.genres.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-block p-8 bg-gray-900 rounded-full mb-6">
              <svg className="w-20 h-20 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-gray-400 text-xl">No artists found</p>
            <p className="text-gray-500 mt-2">Try adjusting your search query</p>
          </div>
        )}
      </div>
    );
  };
  const renderAlbums = () => {
    const filteredAlbums = getFilteredAlbums();

    return (
      <div className="space-y-6">
        <p className="text-gray-400">{filteredAlbums.length} Albums</p>

        {filteredAlbums.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {filteredAlbums.map((album) => (
              <div
                key={`${album.artist}-${album.title}`}
                className="group bg-gray-900/30 p-4 rounded-xl hover:bg-gray-800/50 transition cursor-pointer"
                onClick={() => handleAlbumClick(album.artist, album.title)}
              >
                <div className="relative w-full aspect-square bg-gray-800 rounded-lg overflow-hidden mb-4">
                  {album.thumbnail ? (
                    <img
                      src={album.thumbnail}
                      alt={album.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                </div>

                <h3 className="font-semibold text-white truncate mb-1 group-hover:text-purple-400 transition">
                  {album.title}
                </h3>
                <p className="text-sm text-gray-400 truncate mb-2">{album.artist}</p>

                <div className="space-y-1">
                  <p className="text-sm text-gray-400">{album.track_count} tracks</p>
                  <p className="text-sm text-gray-400">{album.total_duration_formatted}</p>
                  <p className="text-sm text-gray-500">{new Date(album.release_date).getFullYear()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-block p-8 bg-gray-900 rounded-full mb-6">
              <svg className="w-20 h-20 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </div>
            <p className="text-gray-400 text-xl">No albums found</p>
            <p className="text-gray-500 mt-2">Try adjusting your search query</p>
          </div>
        )}
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="pt-20 px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-3">Music</h1>
          <p className="text-gray-400 text-lg">
            Discover and enjoy {allMusic.length} tracks from {artists.length} artists across {albums.length} albums
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search songs, artists, albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-4 bg-gray-900/50 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
          />
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-800">
          <div className="flex gap-8">
            {['Songs', 'Albums', 'Artists'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-2 font-semibold transition relative ${activeTab === tab
                  ? 'text-white'
                  : 'text-gray-400 hover:text-gray-300'
                  }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Genre Filter - Only show for Songs and Artists tabs */}
        {(activeTab === 'Songs' || activeTab === 'Artists') && (
          <div className="mb-8">
            <p className="text-sm text-gray-400 mb-3">Genre:</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedGenre('All')}
                className={`px-5 py-2 rounded-full whitespace-nowrap transition font-medium ${selectedGenre === 'All'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                  }`}
              >
                All
              </button>
              {genres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-5 py-2 rounded-full whitespace-nowrap transition font-medium ${selectedGenre === genre
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                    }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        {renderContent()}
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
