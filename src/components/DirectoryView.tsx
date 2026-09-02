'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { TrendingUp, Contact } from 'lucide-react'

type User = {
  id: string
  full_name: string
  email: string
  role: string
  group_id: string | null
  roll_number?: string | null
  groups: { name: string } | null
}

type Group = {
  id: string
  name: string
}

type Props = {
  users: User[]
  groups: Group[]
  currentRole: string
  teamRegistrations: any[]
  teamAttendance?: { user_id: string, date: string }[]
}

export default function DirectoryView({ users, groups, currentRole, teamRegistrations, teamAttendance = [] }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [groupFilter, setGroupFilter] = useState('all')
  const [selectedJuniorId, setSelectedJuniorId] = useState<string | null>(null)

  const isAdmin = currentRole === 'admin'

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (u.roll_number && u.roll_number.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesGroup = groupFilter === 'all' || u.group_id === groupFilter

    return matchesSearch && matchesGroup
  })

  const seniors = filteredUsers.filter(u => u.role === 'senior')
  const juniors = filteredUsers.filter(u => u.role === 'junior')

  const selectedJunior = juniors.find(u => u.id === selectedJuniorId)
  let drillDownData: any[] = []
  
  if (selectedJuniorId) {
    const dateMap: Record<string, { date: string; regs: number; revenue: number; present: number }> = {}
    teamRegistrations.filter(r => r.registered_by === selectedJuniorId).forEach(r => {
      if (!r.created_at) return
      const dateObj = new Date(r.created_at)
      const date = dateObj.toLocaleDateString('en-GB')
      if (!dateMap[date]) {
        dateMap[date] = { date, regs: 0, revenue: 0, present: 0 }
      }
      dateMap[date].regs += 1
      dateMap[date].revenue += (Number(r.reg_fee) || 0)
    })

    // Add attendance data
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
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <Input 
            placeholder="Search by Name or Roll Number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:max-w-md"
          />
          {isAdmin && (
            <Select value={groupFilter} onValueChange={(val) => setGroupFilter(val || 'all')}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter by Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {groups.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Contact className="w-5 h-5 text-gray-500" /> Seniors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Group</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seniors.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-semibold text-gray-900">{u.full_name}</TableCell>
                    <TableCell className="font-mono text-gray-500">{u.roll_number || '-'}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.groups?.name || 'Unassigned'}</TableCell>
                  </TableRow>
                ))}
                {seniors.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                      No seniors found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Contact className="w-5 h-5 text-gray-500" /> Juniors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Group</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {juniors.map((u) => (
                  <TableRow 
                    key={u.id} 
                    className={currentRole !== 'junior' ? "cursor-pointer hover:bg-gray-50 transition-colors" : ""}
                    onClick={() => {
                      if (currentRole !== 'junior') setSelectedJuniorId(u.id)
                    }}
                  >
                    <TableCell className="font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        {u.full_name}
                        {currentRole !== 'junior' && <TrendingUp className="w-3 h-3 text-blue-500 opacity-50" />}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-gray-500">{u.roll_number || '-'}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.groups?.name || 'Unassigned'}</TableCell>
                  </TableRow>
                ))}
                {juniors.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                      No juniors found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
