'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { Search, CheckCircle2 } from 'lucide-react'

type Junior = {
  id: string
  full_name: string
  roll_number: string | null
}

type Props = {
  juniors: Junior[]
  presentUserIds: string[]
  todayDateString: string
}

export default function AttendanceView({ juniors, presentUserIds: initialPresentIds, todayDateString }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set(initialPresentIds))
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  const supabase = createClient()

  const filteredJuniors = juniors.filter(j => 
    j.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (j.roll_number && j.roll_number.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleMarkPresent = async (userId: string) => {
    // Optimistic Update
    setPresentIds(prev => {
      const next = new Set(prev)
      next.add(userId)
      return next
    })
    setLoadingIds(prev => {
      const next = new Set(prev)
      next.add(userId)
      return next
    })

    const { error } = await supabase.from('attendance').insert({
      user_id: userId,
      date: todayDateString
    })

    if (error) {
      if (error.code === '23505') {
        toast.error('Already marked present today.')
      } else {
        toast.error('Failed to mark attendance', { description: error.message })
        // Revert optimistic update
        setPresentIds(prev => {
          const next = new Set(prev)
          next.delete(userId)
          return next
        })
      }
    } else {
      toast.success('Attendance marked successfully!')
    }

    setLoadingIds(prev => {
      const next = new Set(prev)
      next.delete(userId)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input 
            placeholder="Search by Name or Roll Number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 h-14 text-lg border-2 border-blue-100 focus:border-blue-500 rounded-xl"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredJuniors.map(junior => {
          const isPresent = presentIds.has(junior.id)
          const isLoading = loadingIds.has(junior.id)

          return (
            <Card key={junior.id} className={`transition-colors ${isPresent ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
              <CardContent className="p-4 sm:p-6 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                    {junior.full_name}
                  </h3>
                  <p className="text-gray-500 text-sm sm:text-base font-mono mt-1">
                    {junior.roll_number || 'No Roll Number'}
                  </p>
                </div>

                <div className="shrink-0">
                  {isPresent ? (
                    <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-3 rounded-xl font-bold text-lg border border-green-300">
                      <CheckCircle2 className="w-6 h-6" />
                      Present
                    </div>
                  ) : (
                    <Button 
                      size="lg"
                      onClick={() => handleMarkPresent(junior.id)}
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-14 px-8 text-lg rounded-xl shadow-md w-full sm:w-auto"
                    >
                      {isLoading ? 'Marking...' : 'Mark Present'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {filteredJuniors.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100">
            No juniors found matching your search.
          </div>
        )}
      </div>
    </div>
  )
}
