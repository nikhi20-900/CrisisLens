export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-black/[0.06] ${className}`} />
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-black/[0.06] bg-white p-4 space-y-2.5 shadow-xs">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-8 w-full rounded-lg" />
    </div>
  )
}
