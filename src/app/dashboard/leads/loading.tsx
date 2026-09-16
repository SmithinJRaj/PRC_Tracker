import { Skeleton } from '@/components/ui/skeleton'

export default function LeadsLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>
      <div className="border rounded-lg p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-3 border-b">
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-8 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
