'use client';
import { useRouter } from 'next/navigation';

export default function RecommendationRow({ title, items, type = 'continue_watching' }) {
  const router = useRouter();

  const handleClick = (item) => {
    if (type === 'continue_watching') {
      // For continue watching, navigate to the content detail page
      if (item.content_type === 'episode') {
        router.push(`/detail/${item.content.series_id}?episode=${item.content.id}`);
      } else {
        router.push(`/detail/${item.content.id}`);
      }
    } else {
      // For regular recommendations, use existing logic
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
        {items.map((item, index) => {
          // Handle different item structures
          const content = type === 'continue_watching' ? item.content : item;
          const progressPercentage = type === 'continue_watching' ? item.progress_percentage : null;
          
          return (
            <div
              key={content.id || item.id}
              onClick={() => handleClick(item)}
              className="flex-shrink-0 w-[280px] cursor-pointer group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="relative w-full h-[157.5px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105 group-hover:ring-2 ring-white/20">
                {content.thumbnail ? (
                  <>
                    <img
                      src={content.thumbnail}
                      alt={content.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-4xl">
                    🎬
                  </div>
                )}
                
                {/* Progress bar for continue watching */}
                {progressPercentage !== null && progressPercentage > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                    <div 
                      className="h-full bg-red-600 transition-all duration-300"
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    />
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
                {content.rating && (
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <span className="text-yellow-400">⭐</span>
                    <span>{content.rating}</span>
                  </div>
                )}

                {/* Progress percentage badge for continue watching */}
                {progressPercentage !== null && progressPercentage > 0 && (
                  <div className="absolute top-3 left-3 bg-red-600/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold">
                    {Math.round(progressPercentage)}%
                  </div>
                )}
              </div>
              
              <div className="mt-3 px-1">
                <h3 className="text-base font-semibold truncate group-hover:text-white transition-colors">
                  {content.title}
                </h3>
                
                {/* Show series info for episodes */}
                {type === 'continue_watching' && item.content_type === 'episode' && (
                  <p className="text-sm text-gray-400 truncate mt-1">
                    {content.series_title} - S{content.season_number}E{content.episode_number}
                  </p>
                )}
                
                {/* Show content type and genre for regular content */}
                {type !== 'continue_watching' && content.content_type && (
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-gray-400 px-2 py-0.5 bg-gray-800 rounded-full">
                      {content.content_type === 'MOVIE' ? 'Movie' : 'Series'}
                    </span>
                    {content.genre && (
                      <span className="text-xs text-gray-500 truncate">{content.genre}</span>
                    )}
                    {/* Display first 2 tags if available */}
                    {content.tags && content.tags.length > 0 && (
                      <>
                        {content.tags.slice(0, 2).map((tag) => (
                          <span 
                            key={tag.id} 
                            className="text-xs text-purple-400 px-2 py-0.5 bg-purple-900/30 rounded-full border border-purple-500/30"
                          >
                            {tag.name}
                          </span>
                        ))}
                        {content.tags.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{content.tags.length - 2}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}