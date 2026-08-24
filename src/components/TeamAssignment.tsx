'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

type User = {
  id: string
  full_name: string
  email: string
  role: string
  group_id: string | null
}

type Group = {
  id: string
  name: string
}

export default function TeamAssignment({ juniors, groups, currentRole, seniorGroupId }: { juniors: User[], groups: Group[], currentRole: string, seniorGroupId?: string }) {
  const [users, setUsers] = useState<User[]>(juniors)
  const supabase = createClient()
  const router = useRouter()

  const handleGroupChange = async (userId: string, newGroupId: string) => {
    const previousUsers = [...users]
    const val = newGroupId === 'none' ? null : newGroupId
    setUsers(users.map(u => u.id === userId ? { ...u, group_id: val } : u))

    const { error } = await supabase
      .from('users')
      .update({ group_id: val })
      .eq('id', userId)

    if (error) {
      toast.error('Failed to assign group', { description: error.message })
      setUsers(previousUsers)
    } else {
      toast.success('Group assigned successfully!')
      router.refresh()
    }
  }

  // Filter available groups in the dropdown based on role
  // Seniors can only assign juniors to their own group.
  const availableGroups = currentRole === 'admin' 
    ? groups 
    : groups.filter(g => g.id === seniorGroupId)

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Assign Juniors to Groups</h2>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Junior Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Assigned Group</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.full_name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Select 
                    value={u.group_id || 'none'} 
                    onValueChange={(val) => handleGroupChange(u.id, val)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {availableGroups.map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                  No juniors found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
