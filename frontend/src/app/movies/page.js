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
    if (!profile) {
      router.push('/profiles');
      return;
    }
    loadContent();
  }, [router]);

  useEffect(() => {
    filterContent();
  }, [selectedGenre, contentType, searchQuery, sortBy, allMovies, allSeries]);

  const loadContent = async () => {
    const token = localStorage.getItem('access_token');
    setLoading(true);

    try {
      const [movieData, seriesData, genreData] = await Promise.all([
        api.getVideos(token, 'MOVIE'),
        api.getVideos(token, 'SERIES'),
        api.getGenres(token, 'video'),
      ]);

      setAllMovies(movieData);
      setAllSeries(seriesData);
      setFilteredMovies(movieData);
      setFilteredSeries(seriesData);

      // Extract and split genres (handle comma-separated genres)
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

    // Filter by search query
    if (searchQuery) {
      movies = movies.filter(m =>
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.genre && m.genre.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      series = series.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.genre && s.genre.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by genre (handle comma-separated genres)
    if (selectedGenre !== 'All') {
      movies = movies.filter(m => {
        if (!m.genre) return false;
        const movieGenres = m.genre.split(',').map(g => g.trim());
        return movieGenres.includes(selectedGenre);
      });
      series = series.filter(s => {
        if (!s.genre) return false;
        const seriesGenres = s.genre.split(',').map(g => g.trim());
        return seriesGenres.includes(selectedGenre);
      });
    }

    // Sort
    const sortFunction = (a, b) => {
      if (sortBy === 'Rating') return b.rating - a.rating;
      if (sortBy === 'Title') return a.title.localeCompare(b.title);
      if (sortBy === 'Year') return new Date(b.release_date) - new Date(a.release_date);
      return 0;
    };

    movies.sort(sortFunction);
    series.sort(sortFunction);

    setFilteredMovies(movies);
    setFilteredSeries(series);
  };

  const totalResults = contentType === 'All Content'
    ? filteredMovies.length + filteredSeries.length
    : contentType === 'Movies'
      ? filteredMovies.length
      : filteredSeries.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="pt-20 px-4 sm:px-8 py-12">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="pt-20 px-4 sm:px-6 md:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 md:mb-3">Movies & Series</h1>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg">Explore our collection of {allMovies.length + allSeries.length} titles</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search movies, series, genres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-4 bg-gray-900/50 text-white rounded-xl border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>

        {/* Filter and Sort - Side by Side on Desktop */}
        <div className="mb-6 flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-8">
          {/* Filter Tabs */}
          <div>
            <p className="text-sm text-gray-400 mb-3">Filter by:</p>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {['All Content', 'Movies', 'Series'].map((type) => (
                <button
                  key={type}
                  onClick={() => setContentType(type)}
                  className={`px-6 py-2.5 rounded-lg whitespace-nowrap transition font-semibold ${contentType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="lg:w-64">
            <p className="text-sm text-gray-400 mb-3">Sort by:</p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-6 py-2.5 bg-gray-800 text-white rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Rating">Rating</option>
              <option value="Title">Title</option>
              <option value="Year">Year</option>
            </select>
          </div>
        </div>

        {/* Genre Filter */}
        <div className="mb-8">
          <p className="text-sm text-gray-400 mb-3">Genre:</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedGenre('All')}
              className={`px-5 py-2 rounded-full whitespace-nowrap transition font-medium ${selectedGenre === 'All'
                ? 'bg-white text-black'
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
                  ? 'bg-white text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                  }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <p className="text-gray-400 mb-6">Showing {totalResults} of {allMovies.length + allSeries.length} results</p>

        {/* Content Grid */}
        <div className="space-y-12">
          {(contentType === 'All Content' || contentType === 'Movies') && filteredMovies.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Movies</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                {filteredMovies.map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => router.push(`/detail/${movie.id}`)}
                    className="group cursor-pointer"
                  >
                    <div className="relative aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden mb-3 transform transition group-hover:scale-105 group-hover:ring-2 ring-white">
                      {movie.thumbnail ? (
                        <img
                          src={movie.thumbnail}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl text-gray-600">
                          🎬
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition">
                        <div className="flex items-center gap-2 text-sm mb-2">
                          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-white font-semibold">{movie.rating}</span>
                        </div>
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm mb-1 truncate group-hover:text-blue-400 transition">{movie.title}</h3>
                    <p className="text-xs text-gray-400">{movie.release_date?.split('-')[0]} • {movie.genre}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(contentType === 'All Content' || contentType === 'Series') && filteredSeries.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Series</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                {filteredSeries.map((series) => (
                  <div
                    key={series.id}
                    onClick={() => router.push(`/detail/${series.id}`)}
                    className="group cursor-pointer"
                  >
                    <div className="relative aspect-[2/3] bg-gray-800 rounded-lg overflow-hidden mb-3 transform transition group-hover:scale-105 group-hover:ring-2 ring-white">
                      {series.thumbnail ? (
                        <img
                          src={series.thumbnail}
                          alt={series.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl text-gray-600">
                          📺
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition">
                        <div className="flex items-center gap-2 text-sm mb-2">
                          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-white font-semibold">{series.rating}</span>
                        </div>
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm mb-1 truncate group-hover:text-blue-400 transition">{series.title}</h3>
                    <p className="text-xs text-gray-400">{series.release_date?.split('-')[0]} • {series.genre}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalResults === 0 && (
            <div className="text-center py-20">
              <div className="inline-block p-8 bg-gray-900 rounded-full mb-6">
                <svg className="w-20 h-20 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-400 text-xl">No results found</p>
              <p className="text-gray-500 mt-2">Try adjusting your filters or search query</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
