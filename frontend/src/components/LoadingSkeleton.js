export default function LoadingSkeleton({ count = 5 }) {
  return (
    <div className="flex gap-4 overflow-x-auto px-8 pb-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="min-w-[280px]">
          <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl mb-3 animate-pulse-slow"></div>
          <div className="h-5 bg-gray-800 rounded-lg w-3/4 mb-2 animate-pulse-slow"></div>
          <div className="h-4 bg-gray-800 rounded-lg w-1/2 animate-pulse-slow"></div>
        </div>
      ))}
    </div>
  );
}
