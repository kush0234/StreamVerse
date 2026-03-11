'use client';
import { useRouter } from 'next/navigation';
import interactionTracker from '@/lib/interactionTracker';

export default function ContentRow({ title, items, type = 'video' }) {
  const router = useRouter();

  const handleClick = (item) => {
    if (type === 'music') {
      if (window.openMusicPlayer) {
        window.openMusicPlayer(item.id);
      }
      // Track music interaction
      interactionTracker.trackView(item.id, 'music');
    } else {
      // Track video interaction
      interactionTracker.trackView(item.id, 'video');
      router.push(`/detail/${item.id}`);
    }
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="mb-12 animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 px-8 text-shadow">{title}</h2>
      <div className="flex gap-4 overflow-x-auto px-8 pb-4 scrollbar-hide">
        {items.map((item, index) => (
          <div
            key={item.id}
            onClick={() => handleClick(item)}
            className="flex-shrink-0 w-[280px] cursor-pointer group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="relative w-full h-[157.5px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105 group-hover:ring-2 ring-white/20">
              {item.thumbnail ? (
                <>
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-4xl">
                  {type === 'music' ? '🎵' : '🎬'}
                </div>
              )}
              
              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-black ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
              </div>

              {/* Rating badge */}
              {item.rating && (
                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <span className="text-yellow-400">⭐</span>
                  <span>{item.rating}</span>
                </div>
              )}
            </div>
            
            <div className="mt-3 px-1">
              <h3 className="text-base font-semibold truncate group-hover:text-white transition-colors">{item.title}</h3>
              {type === 'music' && item.artist && (
                <p className="text-sm text-gray-400 truncate mt-1">{item.artist}</p>
              )}
              {type === 'video' && item.content_type && (
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-gray-400 px-2 py-0.5 bg-gray-800 rounded-full">
                    {item.content_type === 'MOVIE' ? 'Movie' : 'Series'}
                  </span>
                  {item.genre && (
                    <span className="text-xs text-gray-500 truncate">{item.genre}</span>
                  )}
                  {/* Display first 2 tags if available */}
                  {item.tags && item.tags.length > 0 && (
                    <>
                      {item.tags.slice(0, 2).map((tag) => (
                        <span 
                          key={tag.id} 
                          className="text-xs text-purple-400 px-2 py-0.5 bg-purple-900/30 rounded-full border border-purple-500/30"
                        >
                          {tag.name}
                        </span>
                      ))}
                      {item.tags.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{item.tags.length - 2}
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
