const shimmer = `relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent`;

function SkeletonBox({ className = "" }) {
  return <div className={`bg-gray-800 rounded-lg ${shimmer} ${className}`} />;
}

function CardSkeleton() {
  return (
    <div className="min-w-[160px] sm:min-w-[200px] md:min-w-[240px] lg:min-w-[260px] max-w-[260px] flex-shrink-0">
      {/* Thumbnail */}
      <SkeletonBox className="aspect-video rounded-xl mb-3" />
      {/* Badge + title row */}
      <div className="flex items-center gap-2 mb-2">
        <SkeletonBox className="h-4 w-12 rounded-full" />
        <SkeletonBox className="h-4 w-8 rounded-full" />
      </div>
      {/* Title */}
      <SkeletonBox className="h-5 w-3/4 mb-2" />
      {/* Subtitle */}
      <SkeletonBox className="h-4 w-1/2" />
    </div>
  );
}

function GridCardSkeleton() {
  return (
    <div className="flex flex-col">
      <SkeletonBox className="aspect-video rounded-xl mb-3" />
      <div className="flex items-center gap-2 mb-2">
        <SkeletonBox className="h-4 w-12 rounded-full" />
        <SkeletonBox className="h-4 w-8 rounded-full" />
      </div>
      <SkeletonBox className="h-5 w-3/4 mb-2" />
      <SkeletonBox className="h-4 w-1/2" />
    </div>
  );
}

function ListRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl">
      <SkeletonBox className="w-24 h-16 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBox className="h-4 w-3/4" />
        <SkeletonBox className="h-3 w-1/2" />
      </div>
      <SkeletonBox className="h-4 w-10 rounded-full flex-shrink-0" />
    </div>
  );
}

/**
 * LoadingSkeleton
 * @param {number} count - number of skeleton items
 * @param {"row" | "grid" | "list"} variant - layout variant
 */
export default function LoadingSkeleton({ count = 5, variant = "row" }) {
  if (variant === "grid") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-4">
        {[...Array(count)].map((_, i) => (
          <GridCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="flex flex-col gap-2 px-4">
        {[...Array(count)].map((_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  // default: horizontal scroll row
  return (
    <div className="flex gap-3 md:gap-4 overflow-x-auto px-4 md:px-8 pb-4 scrollbar-hide">
      {[...Array(count)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
