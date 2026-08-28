'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

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
}

type Props = {
  registrations: Registration[]
  users: User[]
}

export default function SummaryView({ registrations, users }: Props) {
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

  const renderDashboard = (filterType: 'overall' | 'state' | 'district') => {
    let filteredRegs = enrichedRegistrations
    if (filterType === 'state') {
      filteredRegs = enrichedRegistrations.filter(r => r.aggregated_group_type === 'state')
    } else if (filterType === 'district') {
      filteredRegs = enrichedRegistrations.filter(r => r.groups?.type === 'district')
    }

    const totalRegistrations = filteredRegs.length
    const totalRevenue = filteredRegs.reduce((sum, r) => sum + (r.reg_fee || 0), 0)

    // Calculate active users (users who have at least one registration in this filtered set)
    const activeUserIds = new Set(filteredRegs.filter(r => r.registered_by).map(r => r.registered_by))
    const numActiveUsers = activeUserIds.size
    
    // Average Registrations per User
    const avgRegsPerUser = numActiveUsers > 0 ? (totalRegistrations / numActiveUsers).toFixed(1) : '0.0'

    // Daily Registration Graph
    // Group by YYYY-MM-DD
    const dateMap: Record<string, number> = {}
    filteredRegs.forEach(r => {
      const date = r.created_at.split('T')[0]
      dateMap[date] = (dateMap[date] || 0) + 1
    })

    const chartData = Object.keys(dateMap).sort().map(date => ({
      date,
      count: dateMap[date]
    }))

    // Group Rankings
    const groupMap: Record<string, { name: string, regs: number, revenue: number }> = {}
    
    filteredRegs.forEach(r => {
      const groupName = filterType === 'district' ? (r.groups?.name || 'Unknown') : r.aggregated_group_name
      if (!groupMap[groupName]) {
        groupMap[groupName] = { name: groupName, regs: 0, revenue: 0 }
      }
      groupMap[groupName].regs += 1
      groupMap[groupName].revenue += (r.reg_fee || 0)
    })

    const rankings = Object.values(groupMap).sort((a, b) => b.revenue - a.revenue || b.regs - a.regs)

    return (
      <div className="space-y-8 mt-6">
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

        <Card>
          <CardHeader>
            <CardTitle>Daily Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full pt-4">
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
                    <YAxis allowDecimals={false} />
                    <Tooltip 
                      labelFormatter={(label) => new Date(label as string).toLocaleDateString()}
                      formatter={(value: any) => [value, 'Registrations']}
                    />
                    <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No data available for graph
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {filterType !== 'overall' && (
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
                      <TableHead>Group</TableHead>
                      <TableHead className="text-right">Total Registrations</TableHead>
                      <TableHead className="text-right">Total Revenue</TableHead>
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
        )}
      </div>
    )
  }

  return (
    <Tabs defaultValue="overall" className="w-full">
      <div className="flex justify-center mb-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overall">Overall</TabsTrigger>
          <TabsTrigger value="state">State-wise</TabsTrigger>
          <TabsTrigger value="district">District-wise</TabsTrigger>
        </TabsList>
      </div>
      
      <TabsContent value="overall">
        {renderDashboard('overall')}
      </TabsContent>
      <TabsContent value="state">
        {renderDashboard('state')}
      </TabsContent>
      <TabsContent value="district">
        {renderDashboard('district')}
      </TabsContent>
    </Tabs>
  )
}
