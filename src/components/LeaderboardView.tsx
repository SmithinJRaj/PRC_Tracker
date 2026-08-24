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
}

export default function LeaderboardView({ data, groups }: { data: LeaderboardEntry[], groups: Group[] }) {
  const [selectedGroup, setSelectedGroup] = useState<string>('all')

  const groupData = selectedGroup === 'all' 
    ? data 
    : data.filter(d => d.group_id === selectedGroup)

  return (
    <Tabs defaultValue="global" className="w-full max-w-4xl mx-auto">
      <div className="flex justify-center mb-6">
        <TabsList>
          <TabsTrigger value="global">Global Leaderboard</TabsTrigger>
          <TabsTrigger value="group">Group Leaderboard</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="global">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <LeaderboardTable data={data} showGroupBadge={true} />
        </div>
      </TabsContent>

      <TabsContent value="group">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-4">
          <div className="flex justify-end">
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {groups.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <LeaderboardTable data={groupData} showGroupBadge={false} />
        </div>
      </TabsContent>
    </Tabs>
  )
}

function LeaderboardTable({ data, showGroupBadge }: { data: LeaderboardEntry[], showGroupBadge: boolean }) {
  return (
    <div className="rounded-xl overflow-hidden border">
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
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
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
