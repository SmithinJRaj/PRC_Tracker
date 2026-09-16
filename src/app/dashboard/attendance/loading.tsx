import { Skeleton } from '@/components/ui/skeleton'

export default function AttendanceLoading() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <Skeleton className="h-9 w-56 mb-2" />
        <Skeleton className="h-5 w-80" />
      </div>
      <Skeleton className="h-12 w-full max-w-sm" />
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between border rounded-lg p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}
