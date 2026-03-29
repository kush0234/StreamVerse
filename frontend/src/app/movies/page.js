'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import LoadingSkeleton from '@/components/LoadingSkeleton';

export default function MoviesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allMovies, setAllMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [allSeries, setAllSeries] = useState([]);
  const [filteredSeries, setFilteredSeries] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [contentType, setContentType] = useState('All Content');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Rating');

  useEffect(() => {
    const profile = localStorage.getItem('selected_profile');
    if (!profile) { router.push('/profiles'); return; }
    loadContent();
  }, [router]);

  useEffect(() => { filterContent(); }, [selectedGenre, contentType, searchQuery, sortBy, allMovies, allSeries]);

  const loadContent = async () => {
    const token = localStorage.getItem('access_token');
    setLoading(true);
    try {
      const [movieData, seriesData] = await Promise.all([
        api.getVideos(token, 'MOVIE'),
        api.getVideos(token, 'SERIES'),
        api.getGenres(token, 'video'),
      ]);
      setAllMovies(movieData);
      setAllSeries(seriesData);
      setFilteredMovies(movieData);
      setFilteredSeries(seriesData);
      const allGenres = [...new Set([
        ...movieData.flatMap(m => m.genre ? m.genre.split(',').map(g => g.trim()) : []),
        ...seriesData.flatMap(s => s.genre ? s.genre.split(',').map(g => g.trim()) : [])
      ])].filter(Boolean).sort();
      setGenres(allGenres);
    } catch (err) {
      console.error('Failed to load content', err);
    } finally {
      setLoading(false);
    }
  };

  const filterContent = () => {
    let movies = [...allMovies];
    let series = [...allSeries];
    if (searchQuery) {
      movies = movies.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || (m.genre && m.genre.toLowerCase().includes(searchQuery.toLowerCase())));
      series = series.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || (s.genre && s.genre.toLowerCase().includes(searchQuery.toLowerCase())));
    }
    if (selectedGenre !== 'All') {
      movies = movies.filter(m => m.genre && m.genre.split(',').map(g => g.trim()).includes(selectedGenre));
      series = series.filter(s => s.genre && s.genre.split(',').map(g => g.trim()).includes(selectedGenre));
    }
    const sort = (a, b) => {
      if (sortBy === 'Rating') return b.rating - a.rating;
      if (sortBy === 'Title') return a.title.localeCompare(b.title);
      if (sortBy === 'Year') return new Date(b.release_date) - new Date(a.release_date);
      return 0;
    };
    setFilteredMovies([...movies].sort(sort));
    setFilteredSeries([...series].sort(sort));
  };

  const totalResults = contentType === 'All Content'
    ? filteredMovies.length + filteredSeries.length
    : contentType === 'Movies' ? filteredMovies.length : filteredSeries.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-20 px-4 py-12"><LoadingSkeleton /></div>
      </div>
    );
  }

  const CardGrid = ({ items }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
      {items.map((item) => (
        <div key={item.id} onClick={() => router.push(`/detail/${item.id}`)} className="group cursor-pointer">
          <div className="relative aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden mb-2 transition group-hover:ring-2 ring-white">
            {item.thumbnail ? (
              <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-gray-600">
                {item.content_type === 'MOVIE' ? '🎬' : '📺'}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
            <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 opacity-0 group-hover:opacity-100 transition">
              <div className="flex items-center gap-1 text-xs">
                <svg className="w-3 h-3 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-white font-semibold">{item.rating}</span>
              </div>
            </div>
          </div>
          <h3 className="font-semibold text-xs sm:text-sm truncate group-hover:text-blue-400 transition">{item.title}</h3>
          <p className="text-xs text-gray-500 truncate">{item.release_date?.split('-')[0]} · {item.genre?.split(',')[0]}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="pt-20 px-4 sm:px-6 md:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">Movies & Series</h1>
          <p className="text-gray-400 text-sm sm:text-base">{allMovies.length + allSeries.length} titles</p>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search movies, series, genres..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 sm:p-4 bg-gray-900/50 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition mb-5 text-sm sm:text-base"
        />

        {/* Filter + Sort row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 mb-5">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
            {['All Content', 'Movies', 'Series'].map((type) => (
              <button
                key={type}
                onClick={() => setContentType(type)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-semibold transition flex-shrink-0 ${contentType === type ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
              >
                {type}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sm:w-40 px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 text-sm cursor-pointer"
          >
            <option value="Rating">Rating</option>
            <option value="Title">Title</option>
            <option value="Year">Year</option>
          </select>
        </div>

        {/* Genre pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['All', ...genres].map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm whitespace-nowrap transition font-medium ${selectedGenre === genre ? 'bg-white text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'}`}
            >
              {genre}
            </button>
          ))}
        </div>

        <p className="text-gray-500 text-sm mb-6">{totalResults} results</p>

        {/* Grids */}
        <div className="space-y-10">
          {(contentType === 'All Content' || contentType === 'Movies') && filteredMovies.length > 0 && (
            <div>
              <h2 className="text-lg sm:text-xl font-bold mb-4">Movies</h2>
              <CardGrid items={filteredMovies} />
            </div>
          )}
          {(contentType === 'All Content' || contentType === 'Series') && filteredSeries.length > 0 && (
            <div>
              <h2 className="text-lg sm:text-xl font-bold mb-4">Series</h2>
              <CardGrid items={filteredSeries} />
            </div>
          )}
          {totalResults === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">No results found</p>
              <p className="text-gray-500 mt-2 text-sm">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
