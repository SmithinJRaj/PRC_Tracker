'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type LeaderboardEntry = {
  user_id: string
  user_name: string
  role: string
  registration_count: number
  group_id: string | null
  group_name: string | null
}

type Group = {
  id: string
  name: string
  type: string
}

export default function LeaderboardView({ data, groups }: { data: LeaderboardEntry[], groups: Group[] }) {
  const [selectedStateGroup, setSelectedStateGroup] = useState<string>('all')
  const [selectedDistrictGroup, setSelectedDistrictGroup] = useState<string>('all')

  const districtGroups = groups.filter(g => g.type === 'district')
  
  const stateGroupsMap = new Map<string, string>()
  groups.forEach(g => {
    if (g.type === 'state') {
      stateGroupsMap.set(g.id, g.name)
    } else if (g.name.startsWith('Kerala - ')) {
      stateGroupsMap.set('kerala-aggregated', 'Kerala')
    }
  })
  const stateGroupOptions = Array.from(stateGroupsMap.entries()).map(([id, name]) => ({ id, name }))

  // Enrich data with group_type and aggregated names
  const enrichedData = data.map(entry => {
    const group = groups.find(g => g.id === entry.group_id)
    const isKeralaDistrict = group?.name.startsWith('Kerala - ')
    return {
      ...entry,
      original_group_name: group?.name || null,
      original_group_type: group?.type || null,
      aggregated_group_name: isKeralaDistrict ? 'Kerala' : (group?.name || null),
      aggregated_group_type: isKeralaDistrict ? 'state' : (group?.type || null)
    }
  })

  const reduceData = (dataToReduce: typeof enrichedData, groupKey: 'aggregated_group_name' | 'original_group_name', purelyByUser = false) => {
    const reduced = dataToReduce.reduce((acc, curr) => {
      const key = purelyByUser ? curr.user_id : `${curr.user_id}-${curr[groupKey]}`
      if (!acc[key]) {
        acc[key] = { ...curr }
      } else {
        acc[key].registration_count += curr.registration_count
        if (purelyByUser && acc[key][groupKey] !== curr[groupKey] && acc[key][groupKey] !== 'Multiple') {
          ;(acc[key] as any)[groupKey] = 'Multiple'
        }
      }
      return acc
    }, {} as Record<string, typeof enrichedData[0]>)
    return Object.values(reduced).sort((a, b) => b.registration_count - a.registration_count)
  }

  const globalData = reduceData(enrichedData, 'aggregated_group_name', true)

  const stateData = enrichedData.filter(d => d.aggregated_group_type === 'state')
  const reducedStateData = reduceData(stateData, 'aggregated_group_name')
  const filteredStateData = selectedStateGroup === 'all' 
    ? reducedStateData 
    : reducedStateData.filter(d => 
        selectedStateGroup === 'kerala-aggregated'
          ? d.aggregated_group_name === 'Kerala'
          : d.group_id === selectedStateGroup
      )

  const districtData = enrichedData.filter(d => d.original_group_type === 'district')
  const reducedDistrictData = reduceData(districtData, 'original_group_name')
  const filteredDistrictData = selectedDistrictGroup === 'all' 
    ? reducedDistrictData 
    : reducedDistrictData.filter(d => d.group_id === selectedDistrictGroup)

  return (
    <Tabs defaultValue="global" className="w-full max-w-4xl mx-auto">
      <div className="flex justify-center mb-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="global">All India</TabsTrigger>
          <TabsTrigger value="state">State-wise</TabsTrigger>
          <TabsTrigger value="district">District-wise</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="global">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <LeaderboardTable data={globalData} groupNameKey="aggregated_group_name" />
        </div>
      </TabsContent>

      <TabsContent value="state">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-4">
          <div className="flex justify-end">
            <Select value={selectedStateGroup} onValueChange={(val) => setSelectedStateGroup(val || "all")}>
              <SelectTrigger className="w-[200px]">
                <SelectValue>{selectedStateGroup === 'all' ? 'All States' : stateGroupOptions.find(g => g.id === selectedStateGroup)?.name || 'Select State'}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {stateGroupOptions.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <LeaderboardTable data={filteredStateData} groupNameKey="aggregated_group_name" hiddenGroup={selectedStateGroup !== 'all'} />
        </div>
      </TabsContent>

      <TabsContent value="district">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-4">
          <div className="flex justify-end">
            <Select value={selectedDistrictGroup} onValueChange={(val) => setSelectedDistrictGroup(val || "all")}>
              <SelectTrigger className="w-[200px]">
                <SelectValue>{selectedDistrictGroup === 'all' ? 'All Districts' : districtGroups.find(g => g.id === selectedDistrictGroup)?.name || 'Select District'}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {districtGroups.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <LeaderboardTable data={filteredDistrictData} groupNameKey="original_group_name" hiddenGroup={selectedDistrictGroup !== 'all'} />
        </div>
      </TabsContent>
    </Tabs>
  )
}

function LeaderboardTable({ data, groupNameKey, hiddenGroup = false }: { data: any[], groupNameKey: string, hiddenGroup?: boolean }) {
  // We re-sort data just in case the aggregation messes with the order (since multiple people might now have same count)
  // Actually, the original order is by count, so it's already sorted.
  return (
    <div className="rounded-xl overflow-x-auto border">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="w-24 text-center">Rank</TableHead>
            <TableHead>User Name</TableHead>
            <TableHead>Role</TableHead>
            {!hiddenGroup && <TableHead>Group</TableHead>}
            <TableHead className="text-right">Total Registrations</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((entry, index) => (
              <TableRow key={`${entry.user_id}-${entry[groupNameKey]}`} className="hover:bg-gray-50 transition-colors">
                <TableCell className="text-center font-bold text-gray-500">
                  #{index + 1}
                </TableCell>
                <TableCell className="font-semibold text-gray-900">
                  {entry.user_name || 'Unknown User'}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                    entry.role === 'senior' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {entry.role || 'Junior'}
                  </span>
                </TableCell>
                {!hiddenGroup && (
                  <TableCell>
                    {entry[groupNameKey] ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        entry.aggregated_group_type === 'state' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {entry[groupNameKey]}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">None</span>
                    )}
                  </TableCell>
                )}
                <TableCell className="text-right font-mono text-blue-600 font-bold text-lg">
                  {entry.registration_count}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={hiddenGroup ? 4 : 5} className="h-24 text-center text-gray-500">
                No registrations logged yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
