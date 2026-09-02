'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowUp, ArrowDown } from 'lucide-react'

type Registration = {
  id: string
  created_at: string
  event: string | null
  reg_fee: number | null
  registered_by: string | null
  group_id: string | null
  groups: {
    name: string
    type: string
  } | null
}

type User = {
  id: string
  group_id: string | null
  role: string
  groups: {
    name: string
    type: string
  } | null
}

export default function SummaryView({ 
  registrations, 
  users, 
  allowedTabs = ['overall', 'state', 'district'],
  attendanceData = []
}: { 
  registrations: Registration[], 
  users: User[],
  allowedTabs?: string[],
  attendanceData?: { user_id: string, date: string }[]
}) {
  const [selectedState, setSelectedState] = useState<string>('all')
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all')
  const [sortColumn, setSortColumn] = useState<'name' | 'regs' | 'revenue'>('revenue')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  
  const handleSort = (column: 'name' | 'regs' | 'revenue') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  // Common processing
  // Provide aggregated_group_name and aggregated_group_type for 'Kerala' districts
  const enrichedRegistrations = registrations.map(r => {
    const isKeralaDistrict = r.groups?.name.startsWith('Kerala - ')
    return {
      ...r,
      aggregated_group_name: isKeralaDistrict ? 'Kerala' : (r.groups?.name || 'Unknown'),
      aggregated_group_type: isKeralaDistrict ? 'state' : (r.groups?.type || 'Unknown')
    }
  })

  const enrichedUsers = users.map(u => {
    const isKeralaDistrict = u.groups?.name.startsWith('Kerala - ')
    return {
      ...u,
      aggregated_group_name: isKeralaDistrict ? 'Kerala' : (u.groups?.name || 'Unknown'),
      aggregated_group_type: isKeralaDistrict ? 'state' : (u.groups?.type || 'Unknown')
    }
  })

  const renderDashboard = (filterType: 'overall' | 'state' | 'district') => {
    let baseFilteredRegs = enrichedRegistrations
    let baseFilteredUsers = enrichedUsers
    
    if (filterType === 'state') {
      baseFilteredRegs = enrichedRegistrations.filter(r => r.aggregated_group_type === 'state')
      baseFilteredUsers = enrichedUsers.filter(u => u.aggregated_group_type === 'state')
    } else if (filterType === 'district') {
      baseFilteredRegs = enrichedRegistrations.filter(r => r.groups?.type === 'district')
      baseFilteredUsers = enrichedUsers.filter(u => u.groups?.type === 'district')
    }

    const availableGroups = new Set<string>()
    if (filterType !== 'overall') {
      const groupKey = filterType === 'district' ? (x: any) => x.groups?.name : (x: any) => x.aggregated_group_name
      baseFilteredUsers.forEach(u => { const n = groupKey(u); if (n) availableGroups.add(n) })
      baseFilteredRegs.forEach(r => { const n = groupKey(r); if (n) availableGroups.add(n) })
    }
    const groupOptions = Array.from(availableGroups).sort()

    let activeGroup = 'all'
    if (filterType === 'state') activeGroup = selectedState
    else if (filterType === 'district') activeGroup = selectedDistrict

    let filteredRegs = baseFilteredRegs
    let filteredUsers = baseFilteredUsers

    if (activeGroup !== 'all') {
      const groupKey = filterType === 'district' ? (x: any) => x.groups?.name : (x: any) => x.aggregated_group_name
      filteredRegs = filteredRegs.filter(r => groupKey(r) === activeGroup)
      filteredUsers = filteredUsers.filter(u => groupKey(u) === activeGroup)
    }

    const isDrillDown = filterType !== 'overall' && activeGroup !== 'all'

    const totalRegistrations = filteredRegs.length
    const totalRevenue = filteredRegs.reduce((sum, r) => sum + (r.reg_fee || 0), 0)

    const numTotalUsers = filteredUsers.length
    
    // Average Registrations per User
    const avgRegsPerUser = numTotalUsers > 0 ? (totalRegistrations / numTotalUsers).toFixed(1) : '0.0'

    // Daily Registration Graph
    const dateMap: Record<string, { count: number, revenue: number, attendance: number }> = {}
    filteredRegs.forEach(r => {
      const date = r.created_at.split('T')[0]
      if (!dateMap[date]) dateMap[date] = { count: 0, revenue: 0, attendance: 0 }
      dateMap[date].count += 1
      dateMap[date].revenue += (r.reg_fee || 0)
    })

    // Aggregate attendance into dateMap
    attendanceData.forEach(a => {
      const date = a.date
      if (!dateMap[date]) dateMap[date] = { count: 0, revenue: 0, attendance: 0 }
      dateMap[date].attendance += 1
    })

    const chartData = Object.keys(dateMap).sort().map(date => ({
      date,
      count: dateMap[date].count,
      revenue: dateMap[date].revenue,
      avgRegs: numTotalUsers > 0 ? Number((dateMap[date].count / numTotalUsers).toFixed(1)) : 0,
      attendance: dateMap[date].attendance
    }))

    // Group Rankings and Charts
    const groupMap: Record<string, { name: string, regs: number, revenue: number, usersCount: number }> = {}
    
    // First, count all users for each group to get accurate denominators
    filteredUsers.forEach(u => {
      const groupName = filterType === 'district' ? (u.groups?.name || 'Unknown') : u.aggregated_group_name
      if (!groupMap[groupName]) {
        groupMap[groupName] = { name: groupName, regs: 0, revenue: 0, usersCount: 0 }
      }
      groupMap[groupName].usersCount += 1
    })

    // Then, aggregate registrations
    filteredRegs.forEach(r => {
      const groupName = filterType === 'district' ? (r.groups?.name || 'Unknown') : r.aggregated_group_name
      if (!groupMap[groupName]) {
        groupMap[groupName] = { name: groupName, regs: 0, revenue: 0, usersCount: 0 }
      }
      groupMap[groupName].regs += 1
      groupMap[groupName].revenue += (r.reg_fee || 0)
    })

    const rankings = Object.values(groupMap).map(g => ({
      ...g,
      avgRegs: g.usersCount > 0 ? Number((g.regs / g.usersCount).toFixed(1)) : 0
    })).sort((a, b) => {
      const valA = a[sortColumn]
      const valB = b[sortColumn]
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return (
      <div className="space-y-8 mt-6">
        {filterType !== 'overall' && (
          <div className="flex justify-end mb-4">
            <Select 
              value={activeGroup} 
              onValueChange={(val) => filterType === 'state' ? setSelectedState(val || 'all') : setSelectedDistrict(val || 'all')}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder={`Select a ${filterType}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {filterType === 'state' ? 'States' : 'Districts'}</SelectItem>
                {groupOptions.map(g => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {(filterType === 'overall' || isDrillDown) ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Registrations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{totalRegistrations}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">₹{totalRevenue.toLocaleString('en-IN')}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Avg Regs per Active User</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{avgRegsPerUser}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Registrations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full pt-4">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(str) => {
                              const d = new Date(str)
                              return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`
                            }} 
                          />
                          <YAxis allowDecimals={false} width={40} />
                          <Tooltip 
                            labelFormatter={(label) => new Date(label as string).toLocaleDateString()}
                            formatter={(value: any) => [value, 'Registrations']}
                          />
                          <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">No data</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Daily Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full pt-4">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(str) => {
                              const d = new Date(str)
                              return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`
                            }} 
                          />
                          <YAxis tickFormatter={(val) => `₹${val}`} width={60} />
                          <Tooltip 
                            labelFormatter={(label) => new Date(label as string).toLocaleDateString()}
                            formatter={(value: any) => [`₹${value}`, 'Revenue']}
                          />
                          <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">No data</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Daily Avg Regs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full pt-4">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(str) => {
                              const d = new Date(str)
                              return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`
                            }} 
                          />
                          <YAxis width={40} />
                          <Tooltip 
                            labelFormatter={(label) => new Date(label as string).toLocaleDateString()}
                            formatter={(value: any) => [value, 'Avg Registrations']}
                          />
                          <Line type="monotone" dataKey="avgRegs" stroke="#9333ea" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">No data</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Daily Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full pt-4">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(str) => {
                              const d = new Date(str)
                              return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`
                            }} 
                          />
                          <YAxis allowDecimals={false} width={40} />
                          <Tooltip 
                            labelFormatter={(label) => new Date(label as string).toLocaleDateString()}
                            formatter={(value: any) => [value, 'Present']}
                          />
                          <Line type="monotone" dataKey="attendance" stroke="#ea580c" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">No data</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full pt-2">
                    {rankings.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rankings} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tickFormatter={(val) => `₹${val}`} width={60} />
                          <Tooltip formatter={(value: any) => [`₹${value}`, 'Revenue']} />
                          <Bar dataKey="revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">No data</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Total Registrations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full pt-2">
                    {rankings.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rankings} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis allowDecimals={false} width={40} />
                          <Tooltip formatter={(value: any) => [value, 'Registrations']} />
                          <Bar dataKey="regs" fill="#2563eb" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">No data</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Avg Registrations per User</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full pt-2">
                    {rankings.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rankings} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis width={40} />
                          <Tooltip formatter={(value: any) => [value, 'Avg Registrations']} />
                          <Bar dataKey="avgRegs" fill="#9333ea" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">No data</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Group Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24 text-center">Rank</TableHead>
                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                          <div className="flex items-center gap-1">
                            Group
                            {sortColumn === 'name' && (sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />)}
                          </div>
                        </TableHead>
                        <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort('regs')}>
                          <div className="flex items-center justify-end gap-1">
                            Total Registrations
                            {sortColumn === 'regs' && (sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />)}
                          </div>
                        </TableHead>
                        <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort('revenue')}>
                          <div className="flex items-center justify-end gap-1">
                            Total Revenue
                            {sortColumn === 'revenue' && (sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />)}
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rankings.map((g, index) => (
                        <TableRow key={g.name} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="text-center font-bold text-gray-500">#{index + 1}</TableCell>
                          <TableCell className="font-semibold text-gray-900">{g.name}</TableCell>
                          <TableCell className="text-right font-mono font-medium">{g.regs}</TableCell>
                          <TableCell className="text-right font-mono text-green-600 font-bold">₹{g.revenue.toLocaleString('en-IN')}</TableCell>
                        </TableRow>
                      ))}
                      {rankings.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-gray-500">No data available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    )
  }

  const tabCols = allowedTabs.length === 1 ? 'grid-cols-1' : allowedTabs.length === 2 ? 'grid-cols-2' : 'grid-cols-3'

  return (
    <Tabs defaultValue={allowedTabs[0]} className="w-full">
      <div className="flex justify-center mb-6">
        <TabsList className={`grid w-full max-w-md ${tabCols}`}>
          {allowedTabs.includes('overall') && <TabsTrigger value="overall">Overall</TabsTrigger>}
          {allowedTabs.includes('state') && <TabsTrigger value="state">State-wise</TabsTrigger>}
          {allowedTabs.includes('district') && <TabsTrigger value="district">District-wise</TabsTrigger>}
        </TabsList>
      </div>
      
      {allowedTabs.includes('overall') && (
        <TabsContent value="overall">
          {renderDashboard('overall')}
        </TabsContent>
      )}
      
      {allowedTabs.includes('state') && (
        <TabsContent value="state">
          {renderDashboard('state')}
        </TabsContent>
      )}
      
      {allowedTabs.includes('district') && (
        <TabsContent value="district">
          {renderDashboard('district')}
        </TabsContent>
      )}
    </Tabs>
  )
}
