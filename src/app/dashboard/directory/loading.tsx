import { Skeleton } from '@/components/ui/skeleton'

export default function DirectoryLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-80" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-10 w-44" />
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-6 w-24" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-10 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
