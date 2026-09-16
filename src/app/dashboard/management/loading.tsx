import { Skeleton } from '@/components/ui/skeleton'

export default function ManagementLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-56 mb-2" />
        <Skeleton className="h-5 w-80" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="border rounded-lg p-6 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  )
}
