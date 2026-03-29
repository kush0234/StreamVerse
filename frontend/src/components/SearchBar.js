'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoading(true);
      const token = localStorage.getItem('access_token');

      try {
        const [videos, music] = await Promise.all([
          api.getVideos(token).catch(() => []),
          api.getMusic(token).catch(() => [])
        ]);

        const searchLower = query.toLowerCase();

        const videoResults = videos
          .filter(v =>
            v.title.toLowerCase().includes(searchLower) ||
            v.genre.toLowerCase().includes(searchLower)
          )
          .slice(0, 3)
          .map(v => ({ ...v, type: 'video' }));

        const musicResults = music
          .filter(m =>
            m.title.toLowerCase().includes(searchLower) ||
            m.artist.toLowerCase().includes(searchLower) ||
            m.genre.toLowerCase().includes(searchLower)
          )
          .slice(0, 3)
          .map(m => ({ ...m, type: 'music' }));

        setSuggestions([...videoResults, ...musicResults]);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
      setShowSuggestions(false);
      setQuery('');
    }
  };

  const handleSuggestionClick = (item) => {
    if (item.type === 'video') {
      router.push(`/detail/${item.id}`);
    } else {
      router.push(`/music`);
    }
    setIsOpen(false);
    setShowSuggestions(false);
    setQuery('');
  };

  return (
    <div className="relative" ref={searchRef}>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-white/10 rounded-full transition-all hover:scale-110 flex-shrink-0"
          title="Search"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      ) : (
        <div className="relative">
          <form onSubmit={handleSearch} className="flex items-center">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="bg-gray-800/90 backdrop-blur-sm text-white px-3 py-2 pl-9 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-36 sm:w-48 md:w-64 lg:w-80 transition-all text-sm"
                autoFocus
              />
              <svg
                className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {loading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                </div>
              )}
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 px-3 py-2 transition-colors"
              title="Search"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setQuery('');
                setShowSuggestions(false);
              }}
              className="ml-1 md:ml-2 p-2 hover:bg-white/10 rounded-full transition-all hover:scale-110"
              title="Close"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </form>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full mt-2 right-0 w-72 sm:w-80 md:w-96 bg-gray-900/95 backdrop-blur-lg rounded-lg shadow-2xl border border-gray-800 overflow-hidden z-50 animate-fade-in">
              <div className="max-h-96 overflow-y-auto">
                {suggestions.map((item, index) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleSuggestionClick(item)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/80 transition-colors text-left border-b border-gray-800 last:border-0"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-800">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          {item.type === 'video' ? '🎬' : '🎵'}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white truncate">{item.title}</h4>
                      <p className="text-sm text-gray-400 truncate">
                        {item.type === 'video' ? (
                          <>
                            {item.content_type} • {item.genre}
                          </>
                        ) : (
                          <>
                            {item.artist} • {item.genre}
                          </>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${item.type === 'video'
                          ? 'bg-blue-600/20 text-blue-400'
                          : 'bg-purple-600/20 text-purple-400'
                          }`}>
                          {item.type === 'video' ? 'Video' : 'Music'}
                        </span>
                        {item.rating && (
                          <span className="text-xs text-yellow-400 flex items-center gap-1">
                            ⭐ {item.rating}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>

              {/* View All Results */}
              <button
                onClick={handleSearch}
                className="w-full px-4 py-3 bg-gray-800/50 hover:bg-gray-800 transition-colors text-center text-sm text-blue-400 font-semibold"
              >
                View all results for "{query}" →
              </button>
            </div>
          )}

          {/* No Results */}
          {showSuggestions && suggestions.length === 0 && query.trim().length >= 2 && !loading && (
            <div className="absolute top-full mt-2 right-0 w-72 sm:w-80 md:w-96 bg-gray-900/95 backdrop-blur-lg rounded-lg shadow-2xl border border-gray-800 p-6 text-center z-50 animate-fade-in">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-gray-400">No results found for "{query}"</p>
              <p className="text-sm text-gray-500 mt-2">Try different keywords</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
