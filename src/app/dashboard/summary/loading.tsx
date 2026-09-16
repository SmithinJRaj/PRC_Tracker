import { Skeleton } from '@/components/ui/skeleton'

export default function SummaryLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>
      <div className="flex justify-center mb-6">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-6 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-48 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
