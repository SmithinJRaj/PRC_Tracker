'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { UserPlus, UserMinus } from 'lucide-react'

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

export default function TeamAssignment({ members, groups, currentRole, seniorGroupId }: { members: User[], groups: Group[], currentRole: string, seniorGroupId?: string }) {
  const [users, setUsers] = useState<User[]>(members)
  const supabase = createClient()
  const router = useRouter()

  const handleGroupChange = async (userId: string, newGroupId: string | null) => {
    const previousUsers = [...users]
    setUsers(users.map(u => u.id === userId ? { ...u, group_id: newGroupId } : u))

    const { error } = await supabase
      .from('users')
      .update({ group_id: newGroupId })
      .eq('id', userId)

    if (error) {
      toast.error('Failed to assign group', { description: error.message })
      setUsers(previousUsers)
    } else {
      toast.success(newGroupId ? 'Added to team successfully!' : 'Removed from team successfully!')
      router.refresh()
    }
  }

  if (currentRole === 'admin') {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Assign Juniors to Groups</h2>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Assigned Group</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.full_name} <span className="text-xs text-gray-500 ml-2 capitalize">({u.role})</span>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Select 
                      value={u.group_id || 'none'} 
                      onValueChange={(val) => handleGroupChange(u.id, val === 'none' ? null : val)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue>{u.group_id ? groups.find(g => g.id === u.group_id)?.name || 'Unknown' : 'Unassigned'}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Unassigned</SelectItem>
                        {groups.map(g => (
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
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  // Senior View
  const unassignedJuniors = users.filter(u => u.group_id === null && u.role === 'junior')
  const myTeam = users.filter(u => u.group_id === seniorGroupId && u.role === 'junior')

  return (
    <div className="space-y-8 mt-8">
      {/* My Team */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">My Team</h2>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Junior Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myTeam.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleGroupChange(u.id, null)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <UserMinus className="w-4 h-4 mr-2 hidden sm:inline" /> Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {myTeam.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                    Your team is empty. Add juniors from the list below.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Unassigned Juniors */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Unassigned Juniors</h2>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Junior Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unassignedJuniors.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => handleGroupChange(u.id, seniorGroupId!)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <UserPlus className="w-4 h-4 mr-2 hidden sm:inline" /> Add
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {unassignedJuniors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                    No unassigned juniors available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
