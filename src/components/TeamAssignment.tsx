'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { UserPlus, UserMinus, TrendingUp } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

type User = {
  id: string
  full_name: string
  email: string
  role: string
  group_id: string | null
  roll_number?: string | null
}

type Group = {
  id: string
  name: string
}

export default function TeamAssignment({ 
  members, 
  groups, 
  currentRole, 
  seniorGroupIds = [],
  teamRegistrations = [],
  teamAttendance = []
}: { 
  members: User[], 
  groups: Group[], 
  currentRole: string, 
  seniorGroupIds?: string[],
  teamRegistrations?: any[],
  teamAttendance?: { user_id: string, date: string }[]
}) {
  const [users, setUsers] = useState<User[]>(members)
  const [selectedJuniorId, setSelectedJuniorId] = useState<string | null>(null)
  const [assignSelections, setAssignSelections] = useState<Record<string, string>>({})
  const [searchJunior, setSearchJunior] = useState('')
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
  const unassignedJuniors = users.filter(u => u.group_id === null && u.role === 'junior').filter(u => 
    u.full_name.toLowerCase().includes(searchJunior.toLowerCase()) || 
    (u.roll_number && u.roll_number.toLowerCase().includes(searchJunior.toLowerCase()))
  )
  const myTeam = users.filter(u => u.group_id && seniorGroupIds.includes(u.group_id) && u.role === 'junior')

  const performanceMap: Record<string, { id: string, name: string, regs: number, revenue: number }> = {}
  myTeam.forEach(u => {
    performanceMap[u.id] = { id: u.id, name: u.full_name, regs: 0, revenue: 0 }
  })

  teamRegistrations.forEach(r => {
    if (r.registered_by && performanceMap[r.registered_by]) {
      performanceMap[r.registered_by].regs += 1
      performanceMap[r.registered_by].revenue += (Number(r.reg_fee) || 0)
    }
  })

  const performanceData = Object.values(performanceMap).sort((a, b) => b.revenue - a.revenue || b.regs - a.regs)

  // Drill-down data for the selected Junior
  const selectedJunior = myTeam.find(u => u.id === selectedJuniorId)
  let drillDownData: any[] = []
  
  if (selectedJuniorId) {
    const dateMap: Record<string, { date: string; regs: number; revenue: number; present: number }> = {}
    teamRegistrations.filter(r => r.registered_by === selectedJuniorId).forEach(r => {
      if (!r.created_at) return
      const dateObj = new Date(r.created_at)
      const date = dateObj.toLocaleDateString('en-GB') // DD/MM/YYYY
      if (!dateMap[date]) {
        dateMap[date] = { date, regs: 0, revenue: 0, present: 0 }
      }
      dateMap[date].regs += 1
      dateMap[date].revenue += (Number(r.reg_fee) || 0)
    })

    // Add attendance data for this junior
    teamAttendance.filter(a => a.user_id === selectedJuniorId).forEach(a => {
      const dateObj = new Date(a.date)
      const date = dateObj.toLocaleDateString('en-GB')
      if (!dateMap[date]) {
        dateMap[date] = { date, regs: 0, revenue: 0, present: 0 }
      }
      dateMap[date].present = 1
    })
    
    drillDownData = Object.values(dateMap).sort((a, b) => {
      const [d1, m1, y1] = a.date.split('/')
      const [d2, m2, y2] = b.date.split('/')
      return new Date(`${y1}-${m1}-${d1}`).getTime() - new Date(`${y2}-${m2}-${d2}`).getTime()
    })
  }

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

      {/* Junior Leaderboard */}
      {myTeam.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Junior Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24 text-center">Rank</TableHead>
                    <TableHead>Junior Name</TableHead>
                    <TableHead className="text-right">Total Registrations</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performanceData.map((data, index) => (
                    <TableRow key={data.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="text-center font-bold text-gray-500">#{index + 1}</TableCell>
                      <TableCell className="font-semibold text-gray-900">{data.name}</TableCell>
                      <TableCell className="text-right font-mono font-medium">{data.regs}</TableCell>
                      <TableCell className="text-right font-mono text-green-600 font-bold">₹{data.revenue.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          onClick={() => setSelectedJuniorId(data.id)}
                        >
                          <TrendingUp className="w-4 h-4 mr-2 hidden sm:inline" /> View Trend
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedJuniorId} onOpenChange={(open) => !open && setSelectedJuniorId(null)}>
        <DialogContent className="max-w-3xl lg:max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedJunior?.full_name}&apos;s Daily Trend</DialogTitle>
            <DialogDescription>
              Performance breakdown over time for this junior.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="h-[300px] w-full">
              <h3 className="text-sm font-semibold mb-2 text-center">Daily Registrations</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={drillDownData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} width={40} />
                  <Tooltip formatter={(value: any) => [value, 'Registrations']} />
                  <Line type="monotone" dataKey="regs" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="h-[300px] w-full">
              <h3 className="text-sm font-semibold mb-2 text-center">Daily Revenue</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={drillDownData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(val) => `₹${val}`} width={60} />
                  <Tooltip formatter={(value: any) => [`₹${value}`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="h-[300px] w-full md:col-span-2">
              <h3 className="text-sm font-semibold mb-2 text-center">Daily Attendance</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={drillDownData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} domain={[0, 1]} ticks={[0, 1]} width={40} tickFormatter={(val) => val === 1 ? 'Yes' : 'No'} />
                  <Tooltip formatter={(value: any) => [value === 1 ? 'Present' : 'Absent', 'Attendance']} />
                  <Bar dataKey="present" fill="#ea580c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {selectedJuniorId && (
              <div className="md:col-span-2 mt-6">
                <h3 className="text-lg font-bold mb-4">
                  Total Registrations: {teamRegistrations?.filter(r => r.registered_by === selectedJuniorId).length || 0}
                </h3>
                <div className="max-h-64 overflow-y-auto border rounded-md">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10">
                      <TableRow>
                        <TableHead>Attendee Name</TableHead>
                        <TableHead>College</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamRegistrations?.filter(r => r.registered_by === selectedJuniorId).map((reg) => (
                        <TableRow key={reg.id}>
                          <TableCell className="font-medium">{reg.attendee_name}</TableCell>
                          <TableCell>{reg.college_name || '-'}</TableCell>
                          <TableCell>{new Date(reg.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                      {(!teamRegistrations || teamRegistrations.filter(r => r.registered_by === selectedJuniorId).length === 0) && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                            No registrations found for this junior.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className="text-xl font-semibold text-gray-900">Unassigned Juniors</h2>
          <input 
            type="text" 
            placeholder="Search name or roll number..." 
            value={searchJunior}
            onChange={(e) => setSearchJunior(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
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
                    <div className="flex items-center justify-end gap-2">
                      <Select 
                        value={assignSelections[u.id] || ''} 
                        onValueChange={(val) => setAssignSelections({...assignSelections, [u.id]: val as string})}
                      >
                        <SelectTrigger className="w-[150px] h-8">
                          <SelectValue placeholder="Select Group" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.filter(g => seniorGroupIds.includes(g.id)).map(g => (
                            <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="default" 
                        size="sm" 
                        disabled={!assignSelections[u.id]}
                        onClick={() => {
                          handleGroupChange(u.id, assignSelections[u.id])
                          setAssignSelections(prev => {
                            const next = { ...prev }
                            delete next[u.id]
                            return next
                          })
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <UserPlus className="w-4 h-4 mr-2 hidden sm:inline" /> Add
                      </Button>
                    </div>
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
