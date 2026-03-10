'use client';
import { useRouter } from 'next/navigation';

export default function ComingSoonSection({ items }) {
  const router = useRouter();

  if (!items || items.length === 0) {
    return null;
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Coming Soon';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="mb-12 animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 px-8 text-shadow flex items-center gap-3">
        <span className="text-3xl">🎬</span>
        Coming Soon
      </h2>
      <div className="flex gap-4 overflow-x-auto px-8 pb-4 scrollbar-hide">
        {items.map((item, index) => (
          <div
            key={item.id}
            onClick={() => router.push(`/detail/${item.id}`)}
            className="flex-shrink-0 w-[280px] cursor-pointer group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="relative w-full h-[157.5px] bg-gradient-to-br from-purple-900 to-blue-900 rounded-xl overflow-hidden shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105 group-hover:ring-2 ring-purple-500/50">
              {item.thumbnail ? (
                <>
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Dark overlay for coming soon effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                  🎬
                </div>
              )}

              {/* Coming Soon Badge */}
              <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg animate-pulse">
                COMING SOON
              </div>

              {/* Expected Release Date */}
              {item.expected_release_date && (
                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold">
                  📅 {formatDate(item.expected_release_date)}
                </div>
              )}

              {/* Info Icon Overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              {/* Bottom gradient with title */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black to-transparent">
                <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
                {item.genre && (
                  <p className="text-xs text-gray-300 truncate mt-0.5">{item.genre}</p>
                )}
              </div>
            </div>

            <div className="mt-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-purple-400 px-2 py-0.5 bg-purple-900/30 rounded-full border border-purple-500/30">
                  {item.content_type === 'MOVIE' ? 'Movie' : 'Series'}
                </span>
                {item.expected_release_date && (
                  <span className="text-xs text-gray-500">
                    {formatDate(item.expected_release_date)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
