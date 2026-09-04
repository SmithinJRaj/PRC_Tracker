'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type Group = {
  id: string
  name: string
  type: string
}

export default function OnboardingGate({ userId, groups }: { userId: string, groups: Group[] }) {
  const [selectedGroup, setSelectedGroup] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const districtGroups = groups.filter(g => g.type === 'district')

  const handleSubmit = async () => {
    if (!selectedGroup) {
      toast.error('Please select a district group.')
      return
    }

    setLoading(true)
    const { error } = await supabase
      .from('users')
      .update({ group_id: selectedGroup })
      .eq('id', userId)

    if (error) {
      toast.error('Failed to join group', { description: error.message })
    } else {
      toast.success('Welcome aboard! Redirecting...')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Tathva PR</h1>
          <p className="mt-2 text-gray-600">
            Select your district group to get started. This determines your team assignment.
          </p>
        </div>

        <div className="space-y-4">
          <Select value={selectedGroup} onValueChange={(val) => setSelectedGroup(val || '')}>
            <SelectTrigger>
              <SelectValue placeholder="Select your District" />
            </SelectTrigger>
            <SelectContent>
              {districtGroups.map(g => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
              {districtGroups.length === 0 && (
                <SelectItem value="none" disabled>No district groups available</SelectItem>
              )}
            </SelectContent>
          </Select>

          <Button 
            onClick={handleSubmit} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={loading || !selectedGroup}
          >
            {loading ? 'Joining...' : 'Join Group & Continue'}
          </Button>
        </div>

        <div className="mt-6 pt-4 border-t text-center">
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-sm text-gray-500 hover:text-gray-700 hover:underline">
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
