'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type LeaderboardEntry = {
  junior_id: string
  junior_name: string
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

  const stateGroups = groups.filter(g => g.type === 'state')
  const districtGroups = groups.filter(g => g.type === 'district')

  // Enrich data with group_type
  const enrichedData = data.map(entry => {
    const group = groups.find(g => g.id === entry.group_id)
    return {
      ...entry,
      group_type: group?.type || null
    }
  })

  const stateData = enrichedData.filter(d => d.group_type === 'state')
  const filteredStateData = selectedStateGroup === 'all' 
    ? stateData 
    : stateData.filter(d => d.group_id === selectedStateGroup)

  const districtData = enrichedData.filter(d => d.group_type === 'district')
  const filteredDistrictData = selectedDistrictGroup === 'all' 
    ? districtData 
    : districtData.filter(d => d.group_id === selectedDistrictGroup)

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
          <LeaderboardTable data={enrichedData} showGroupBadge={true} />
        </div>
      </TabsContent>

      <TabsContent value="state">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-4">
          <div className="flex justify-end">
            <Select value={selectedStateGroup} onValueChange={(val) => setSelectedStateGroup(val || "all")}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {stateGroups.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <LeaderboardTable data={filteredStateData} showGroupBadge={selectedStateGroup === 'all'} />
        </div>
      </TabsContent>

      <TabsContent value="district">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-4">
          <div className="flex justify-end">
            <Select value={selectedDistrictGroup} onValueChange={(val) => setSelectedDistrictGroup(val || "all")}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select District" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {districtGroups.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <LeaderboardTable data={filteredDistrictData} showGroupBadge={selectedDistrictGroup === 'all'} />
        </div>
      </TabsContent>
    </Tabs>
  )
}

function LeaderboardTable({ data, showGroupBadge }: { data: (LeaderboardEntry & { group_type: string | null })[], showGroupBadge: boolean }) {
  return (
    <div className="rounded-xl overflow-x-auto border">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="w-24 text-center">Rank</TableHead>
            <TableHead>Junior Name</TableHead>
            {showGroupBadge && <TableHead>Group</TableHead>}
            <TableHead className="text-right">Total Registrations</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((entry, index) => (
              <TableRow key={entry.junior_id} className="hover:bg-gray-50 transition-colors">
                <TableCell className="text-center font-bold text-gray-500">
                  #{index + 1}
                </TableCell>
                <TableCell className="font-semibold text-gray-900">
                  {entry.junior_name}
                </TableCell>
                {showGroupBadge && (
                  <TableCell>
                    {entry.group_name ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        entry.group_type === 'state' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {entry.group_name}
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
              <TableCell colSpan={showGroupBadge ? 4 : 3} className="h-24 text-center text-gray-500">
                No registrations logged yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
