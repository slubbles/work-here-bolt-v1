import { Skeleton } from "@/components/ui/skeleton";

// Skeleton for stats overview cards
export function StatCardSkeleton() {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
    </div>
  );
}

// Skeleton for token cards in the token list
export function TokenCardSkeleton() {
  return (
    <div className="p-4 rounded-lg bg-muted/50 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>
    </div>
  );
}

// Skeleton for charts
export function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="h-64 flex items-end justify-between space-x-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="flex-1" 
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// Skeleton for transaction items
export function TransactionItemSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center space-x-3">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="text-right space-y-1">
        <Skeleton className="h-3 w-16 ml-auto" />
        <Skeleton className="h-4 w-12 ml-auto" />
      </div>
    </div>
  );
}

// Skeleton for the token details overview
export function TokenOverviewSkeleton() {
  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex space-x-2">
          <Skeleton className="w-8 h-8 rounded" />
          <Skeleton className="w-8 h-8 rounded" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-muted/50 rounded-lg p-4 text-center space-y-2">
            <Skeleton className="h-3 w-16 mx-auto" />
            <Skeleton className="h-5 w-20 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton for management actions
export function ManagementActionsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="glass-card p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-12 w-full" />
        </div>
      </div>

      <div className="glass-card p-6 space-y-6">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Skeleton for the entire dashboard loading state
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen app-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-12">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        {/* Stats Overview Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Token List Skeleton */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 space-y-6">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <TokenCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>

          {/* Token Details Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation Skeleton */}
            <div className="glass-card p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex space-x-1 bg-muted/50 rounded-lg p-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 flex-1" />
                  ))}
                </div>
              </div>
            </div>

            {/* Content Skeleton */}
            <TokenOverviewSkeleton />
            <ChartSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}