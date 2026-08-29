'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { UserPlus, UserMinus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

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

export default function TeamAssignment({ 
  members, 
  groups, 
  currentRole, 
  seniorGroupId,
  teamRegistrations = [] 
}: { 
  members: User[], 
  groups: Group[], 
  currentRole: string, 
  seniorGroupId?: string,
  teamRegistrations?: any[]
}) {
  const [users, setUsers] = useState<User[]>(members)
  const supabase = createClient()
  const router = useRouter()

  const handleGroupChange = async (userId: string, newGroupId: string | null) => {
    const previousUsers = [...users]
    setUsers(users.map(u => u.id === userId ? { ...u, group_id: newGroupId } : u))

    const { error } = await supabase.rpc('update_user_group', {
      target_user_id: userId,
      new_group_id: newGroupId
    })

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
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Assign Team Members to Groups</h2>
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

  const performanceMap: Record<string, { name: string, regs: number, revenue: number }> = {}
  myTeam.forEach(u => {
    performanceMap[u.id] = { name: u.full_name, regs: 0, revenue: 0 }
  })

  teamRegistrations.forEach(r => {
    if (r.registered_by && performanceMap[r.registered_by]) {
      performanceMap[r.registered_by].regs += 1
      performanceMap[r.registered_by].revenue += (Number(r.reg_fee) || 0)
    }
  })

  const performanceData = Object.values(performanceMap).sort((a, b) => b.revenue - a.revenue || b.regs - a.regs)

  return (
    <div className="space-y-8 mt-8">
      {/* Performance Dashboard */}
      {myTeam.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} width={40} />
                    <Tooltip formatter={(value: any) => [value, 'Registrations']} />
                    <Bar dataKey="regs" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Team Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(val) => `₹${val}`} width={60} />
                    <Tooltip formatter={(value: any) => [`₹${value}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
