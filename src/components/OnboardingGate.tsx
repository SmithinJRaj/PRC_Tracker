'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

type Group = {
  id: string
  name: string
  type: string
}

export default function OnboardingGate({ userId, groups, role }: { userId: string, groups: Group[], role: string }) {
  const [selectedGroup, setSelectedGroup] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const availableGroups = role === 'junior' 
    ? groups.filter(g => g.type === 'district')
    : groups // Seniors can select states and districts

  const handleSubmit = async () => {
    if (!selectedGroup) {
      toast.error('Please select a group.')
      return
    }

    if (role === 'junior' && (!phone || phone.length < 10)) {
      toast.error('Please enter a valid phone number.')
      return
    }

    setLoading(true)
    const payload: any = { group_id: selectedGroup }
    if (role === 'junior') {
      payload.phone = phone
    }

    const { error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', userId)

    if (error) {
      toast.error('Failed to join group', { description: error.message })
    } else {
      toast.success('Welcome aboard! Redirecting...')
      window.location.href = '/dashboard'
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
          {role === 'junior' && (
            <div>
              <Input 
                placeholder="Phone Number" 
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          )}

          <Select value={selectedGroup} onValueChange={(val) => setSelectedGroup(val || '')}>
            <SelectTrigger>
              <SelectValue placeholder={`Select your ${role === 'junior' ? 'District' : 'Group'}`}>
                {selectedGroup ? availableGroups.find(g => g.id === selectedGroup)?.name : `Select your ${role === 'junior' ? 'District' : 'Group'}`}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableGroups.map(g => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
              {availableGroups.length === 0 && (
                <SelectItem value="none" disabled>No groups available</SelectItem>
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
