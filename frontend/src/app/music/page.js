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
    if (!profile) { router.push('/profiles'); return; }
    loadData();
    window.openMusicPlayer = (id) => setSelectedMusicId(id);
    return () => { delete window.openMusicPlayer; };
  }, [router]);

  useEffect(() => { filterContent(); }, [selectedGenre, searchQuery, allMusic, artists, albums, activeTab]);

  const loadData = async () => {
    const token = localStorage.getItem('access_token');
    const profileStr = localStorage.getItem('selected_profile');
    setLoading(true);
    try {
      const musicData = await api.getMusic(token);
      setAllMusic(musicData);
      setFilteredMusic(musicData);
      const [artistsData, albumsData] = await Promise.all([api.getArtists(token), api.getAlbums(token)]);
      setArtists(artistsData);
      setAlbums(albumsData);
      setGenres([...new Set(musicData.map(m => m.genre))].filter(Boolean));
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        const wl = await api.getWatchlist(token, profile.id);
        setLikedSongs(wl.filter(i => i.music).map(i => i.music.id));
      }
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  const filterContent = () => {
    if (activeTab !== 'Songs') return;
    let music = [...allMusic];
    if (searchQuery) music = music.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.artist.toLowerCase().includes(searchQuery.toLowerCase()) || (m.album && m.album.toLowerCase().includes(searchQuery.toLowerCase())));
    if (selectedGenre !== 'All') music = music.filter(m => m.genre === selectedGenre);
    setFilteredMusic(music);
  };

  const toggleLike = async (musicId) => {
    const token = localStorage.getItem('access_token');
    const profileStr = localStorage.getItem('selected_profile');
    if (!profileStr) return;
    const profile = JSON.parse(profileStr);
    const isLiked = likedSongs.includes(musicId);
    setLikedSongs(isLiked ? likedSongs.filter(id => id !== musicId) : [...likedSongs, musicId]);
    try {
      isLiked ? await api.removeFromWatchlist(token, profile.id, null, musicId) : await api.addToWatchlist(token, profile.id, null, musicId);
    } catch (err) {
      setLikedSongs(isLiked ? [...likedSongs, musicId] : likedSongs.filter(id => id !== musicId));
    }
  };

  const getFilteredArtists = () => {
    let list = [...artists];
    if (searchQuery) list = list.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (selectedGenre !== 'All') list = list.filter(a => a.genres.includes(selectedGenre));
    return list;
  };

  const getFilteredAlbums = () => {
    let list = [...albums];
    if (searchQuery) list = list.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.artist.toLowerCase().includes(searchQuery.toLowerCase()));
    return list;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-20 px-4 py-12"><LoadingSkeleton /></div>
      </div>
    );
  }

  const renderSongs = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">{filteredMusic.length} songs</p>
        <button
          onClick={() => filteredMusic.length > 0 && setSelectedMusicId(filteredMusic[0].id)}
          disabled={filteredMusic.length === 0}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full text-sm font-semibold transition disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
          Play All
        </button>
      </div>

      {filteredMusic.length > 0 ? (
        <div className="bg-gray-900/30 rounded-xl overflow-hidden">
          {/* Desktop header — hidden on mobile */}
          <div className="hidden md:flex items-center gap-4 px-4 py-3 border-b border-gray-800 text-xs text-gray-500 font-medium uppercase tracking-wide">
            <div className="w-8 text-center">#</div>
            <div className="w-12 flex-shrink-0"></div>
            <div className="flex-1">Title</div>
            <div className="w-40">Album</div>
            <div className="w-24">Genre</div>
            <div className="w-14 text-right">Time</div>
            <div className="w-10"></div>
          </div>

          <div className="divide-y divide-gray-800/50">
            {filteredMusic.map((music, index) => (
              <div
                key={music.id}
                className="group flex items-center gap-3 px-3 sm:px-4 py-3 hover:bg-gray-800/50 transition cursor-pointer"
                onClick={() => setSelectedMusicId(music.id)}
              >
                {/* Index — md+ only */}
                <div className="hidden md:flex w-8 items-center justify-center text-gray-500 text-sm flex-shrink-0">
                  <span className="group-hover:hidden">{index + 1}</span>
                  <svg className="hidden group-hover:block w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>

                {/* Thumbnail */}
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                  {music.thumbnail ? (
                    <img src={music.thumbnail} alt={music.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Title + artist — always visible */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate group-hover:text-purple-400 transition">{music.title}</p>
                  <p className="text-xs text-gray-400 truncate">{music.artist}</p>
                </div>

                {/* Album — md+ */}
                <div className="hidden md:block w-40 text-sm text-gray-400 truncate flex-shrink-0">{music.album || '—'}</div>

                {/* Genre — lg+ */}
                <div className="hidden lg:block w-24 flex-shrink-0">
                  <span className="px-2 py-0.5 bg-gray-800 rounded-full text-xs text-gray-300">{music.genre}</span>
                </div>

                {/* Duration */}
                <div className="text-xs text-gray-400 w-10 text-right flex-shrink-0">
                  {music.duration ? `${Math.floor(music.duration / 60)}:${String(music.duration % 60).padStart(2, '0')}` : '—'}
                </div>

                {/* Like */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLike(music.id); }}
                  className="p-1.5 hover:bg-gray-700 rounded-full transition flex-shrink-0"
                >
                  <svg
                    className={`w-4 h-4 ${likedSongs.includes(music.id) ? 'text-purple-500' : 'text-gray-500'}`}
                    fill={likedSongs.includes(music.id) ? 'currentColor' : 'none'}
                    stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">No songs found</div>
      )}
    </div>
  );

  const renderGrid = (items, nameKey, subKey, onClick) => (
    items.length > 0 ? (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {items.map((item, i) => (
          <div key={i} className="group bg-gray-900/30 p-3 sm:p-4 rounded-xl hover:bg-gray-800/50 transition cursor-pointer" onClick={() => onClick(item)}>
            <div className="relative w-full aspect-square bg-gray-800 rounded-lg overflow-hidden mb-3">
              {item.thumbnail ? (
                <img src={item.thumbnail} alt={item[nameKey]} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                  </svg>
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
            </div>
            <p className="font-semibold text-sm truncate group-hover:text-purple-400 transition">{item[nameKey]}</p>
            {subKey && <p className="text-xs text-gray-400 truncate mt-0.5">{item[subKey]}</p>}
          </div>
        ))}
      </div>
    ) : <div className="text-center py-16 text-gray-400">Nothing found</div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="pt-20 px-4 sm:px-6 md:px-8 py-6">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">Music</h1>
          <p className="text-gray-400 text-sm sm:text-base">{allMusic.length} tracks · {artists.length} artists · {albums.length} albums</p>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search songs, artists, albums..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 sm:p-4 bg-gray-900/50 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition mb-5 text-sm sm:text-base"
        />

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900/50 rounded-xl p-1 mb-5 w-fit">
          {['Songs', 'Albums', 'Artists'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-semibold transition ${activeTab === tab ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Genre filter — Songs & Artists only */}
        {(activeTab === 'Songs' || activeTab === 'Artists') && (
          <div className="flex flex-wrap gap-2 mb-6">
            {['All', ...genres].map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm whitespace-nowrap transition font-medium ${selectedGenre === genre ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'}`}
              >
                {genre}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {activeTab === 'Songs' && renderSongs()}
        {activeTab === 'Artists' && renderGrid(getFilteredArtists(), 'name', null, (a) => router.push(`/music/artist/${encodeURIComponent(a.name)}`))}
        {activeTab === 'Albums' && renderGrid(getFilteredAlbums(), 'title', 'artist', (a) => router.push(`/music/album/${encodeURIComponent(a.artist)}/${encodeURIComponent(a.title)}`))}
      </div>

      {selectedMusicId && <MusicPlayer musicId={selectedMusicId} onClose={() => setSelectedMusicId(null)} />}
    </div>
  );
}
