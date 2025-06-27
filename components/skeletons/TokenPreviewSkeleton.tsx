import { Skeleton } from "@/components/ui/skeleton";

export function TokenPreviewSkeleton() {
  return (
    <div className="xl:sticky xl:top-24 space-y-6">
      {/* Header Skeleton */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Skeleton className="w-5 h-5" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="w-5 h-5" />
        </div>
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>

      {/* Network Badge Skeleton */}
      <div className="text-center space-y-3">
        <Skeleton className="h-8 w-40 mx-auto rounded-xl" />
        <Skeleton className="h-3 w-32 mx-auto" />
      </div>

      {/* Main Preview Card Skeleton */}
      <div className="glass-card p-10 space-y-8 relative overflow-hidden">
        <div className="text-center space-y-8 relative z-10">
          <Skeleton className="h-4 w-24 mx-auto" />
          
          {/* Token Image/Circle Skeleton */}
          <div className="flex justify-center relative">
            <Skeleton className="w-40 h-40 rounded-full" />
          </div>

          {/* Token Name and Symbol Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-10 w-48 mx-auto" />
            <Skeleton className="h-6 w-16 mx-auto" />
          </div>

          {/* Description Skeleton */}
          <div className="glass-card p-6 bg-muted/20 rounded-xl">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
            </div>
          </div>
        </div>

        {/* Actions Title Skeleton */}
        <Skeleton className="h-4 w-32 mx-auto" />

        {/* Action Buttons Skeleton */}
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl col-span-2" />
        </div>

        {/* Status Skeleton */}
        <div className="pt-8 border-t border-border text-center">
          <div className="flex items-center justify-center space-x-2">
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </div>

      {/* Deployment Details Card Skeleton */}
      <div className="glass-card p-8 space-y-6">
        <div className="flex items-center space-x-2">
          <Skeleton className="w-5 h-5" />
          <Skeleton className="h-6 w-40" />
        </div>
        
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center p-4 bg-muted/30 rounded-xl">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>

        {/* Features Section Skeleton */}
        <div className="pt-6 border-t border-border space-y-4">
          <Skeleton className="h-4 w-40" />
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact version for smaller spaces
export function TokenPreviewSkeletonCompact() {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-3">
        <Skeleton className="w-20 h-20 rounded-full mx-auto" />
        <div className="space-y-1">
          <Skeleton className="h-5 w-32 mx-auto" />
          <Skeleton className="h-4 w-12 mx-auto" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}