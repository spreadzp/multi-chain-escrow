export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-surface-2 ${className}`}
      data-testid="skeleton"
    />
  );
}

export function EscrowCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface-1 p-4 shadow-1" data-testid="escrow-card-skeleton">
      <div className="mb-3 flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="mb-3 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-7 flex-1" />
        <Skeleton className="h-7 flex-1" />
      </div>
    </div>
  );
}

export function EscrowListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3" data-testid="escrow-list-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <EscrowCardSkeleton key={i} />
      ))}
    </div>
  );
}
