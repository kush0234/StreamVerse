'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import LoadingSkeleton from '@/components/LoadingSkeleton';

export default function WatchlistPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    const profile = localStorage.getItem('selected_profile');
    if (!profile) {
      router.push('/profiles');
      return;
    }
    loadWatchlist();
  }, [router]);

  useEffect(() => {
    filterWatchlist();
  }, [activeTab, watchlist]);

  const loadWatchlist = async () => {
    const token = localStorage.getItem('access_token');
    const profile = JSON.parse(localStorage.getItem('selected_profile'));

    try {
      const data = await api.getWatchlist(token, profile.id);
      setWatchlist(data);
    } catch (err) {
      console.error('Failed to load watchlist', err);
    } finally {
      setLoading(false);
    }
  };

  const filterWatchlist = () => {
    if (activeTab === 'All') {
      setFilteredList(watchlist);
    } else if (activeTab === 'Movies & Series') {
      setFilteredList(watchlist.filter(item => item.video));
    } else if (activeTab === 'Music') {
      setFilteredList(watchlist.filter(item => item.music));
    }
  };

  const handleRemove = async (item) => {
    const token = localStorage.getItem('access_token');
    const profile = JSON.parse(localStorage.getItem('selected_profile'));

    try {
      await api.removeFromWatchlist(
        token,
        profile.id,
        item.video?.id,
        item.music?.id
      );
      setWatchlist(watchlist.filter(w => w.id !== item.id));
    } catch (err) {
      console.error('Failed to remove from watchlist', err);
    }
  };

  const handleClick = (item) => {
    if (item.music) {
      if (window.openMusicPlayer) {
        window.openMusicPlayer(item.music.id);
      }
    } else if (item.video) {
      router.push(`/detail/${item.video.id}`);
    }
  };

  const movieCount = watchlist.filter(item => item.video).length;
  const musicCount = watchlist.filter(item => item.music).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-20 px-8 py-12">
          <h1 className="text-4xl font-bold mb-8">My List</h1>
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="pt-20 px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-3">My List</h1>
          <p className="text-gray-400 text-lg">
            {watchlist.length} items • {movieCount} Movies & Series • {musicCount} Songs
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-800">
          <div className="flex gap-8">
            {['All', 'Movies & Series', 'Music'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-2 font-semibold transition relative ${
                  activeTab === tab
                    ? 'text-white'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {filteredList.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredList.map((item) => {
              const content = item.video || item.music;
              const isMusic = !!item.music;
              
              return (
                <div key={item.id} className="group">
                  <div className="relative">
                    <div
                      onClick={() => handleClick(item)}
                      className={`${
                        isMusic ? 'aspect-square' : 'aspect-[2/3]'
                      } bg-gray-800 rounded-lg overflow-hidden cursor-pointer group-hover:ring-2 ring-white transition transform group-hover:scale-105`}
                    >
                      {content.thumbnail ? (
                        <img
                          src={content.thumbnail}
                          alt={content.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                          {isMusic ? (
                            <svg className="w-16 h-16 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                            </svg>
                          ) : (
                            <svg className="w-16 h-16 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                          )}
                        </div>
                      )}
                      
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Remove button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(item);
                      }}
                      className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-red-600 hover:scale-110"
                      title="Remove from list"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    {/* Type badge */}
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        isMusic ? 'bg-purple-600' : 'bg-blue-600'
                      }`}>
                        {isMusic ? 'MUSIC' : item.video?.content_type || 'VIDEO'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="mt-3">
                    <h3 className="font-semibold truncate group-hover:text-blue-400 transition">
                      {content.title}
                    </h3>
                    {isMusic && item.music.artist && (
                      <p className="text-sm text-gray-400 truncate">{item.music.artist}</p>
                    )}
                    {!isMusic && item.video && (
                      <p className="text-sm text-gray-400">
                        {item.video.content_type === 'MOVIE' ? 'Movie' : 'Series'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-block p-8 bg-gray-900 rounded-full mb-6">
              <svg className="w-20 h-20 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <p className="text-gray-400 text-xl">
              {activeTab === 'All' ? 'Your list is empty' : `No ${activeTab.toLowerCase()} in your list`}
            </p>
            <p className="text-gray-500 mt-2">
              {activeTab === 'All' 
                ? 'Add movies, series, or music to your list' 
                : `Add some ${activeTab.toLowerCase()} to see them here`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
