'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import Papa from 'papaparse'
import { Search, CheckCircle2, UserX, Users, Download } from 'lucide-react'

type Junior = {
  id: string
  full_name: string
  roll_number: string | null
  group_id: string | null
}

type Group = {
  id: string
  name: string
  type: string
}

type Props = {
  juniors: Junior[]
  groups: Group[]
  presentUserIds: string[]
  todayDateString: string
}

export default function AttendanceView({ juniors, groups, presentUserIds: initialPresentIds, todayDateString }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all')
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set(initialPresentIds))
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  const supabase = createClient()

  const filteredJuniors = juniors.filter(j => {
    const matchesSearch = 
      j.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (j.roll_number && j.roll_number.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesGroup = selectedGroupId === 'all' || j.group_id === selectedGroupId

    return matchesSearch && matchesGroup
  })

  const presentJuniors = filteredJuniors.filter(j => presentIds.has(j.id))
  const absentJuniors = filteredJuniors.filter(j => !presentIds.has(j.id))

  const exportAttendanceCSV = () => {
    const data = filteredJuniors.map(junior => ({
      "Roll Number": junior.roll_number || '',
      "Name": junior.full_name,
      "Date": todayDateString,
      "Status": presentIds.has(junior.id) ? "Present" : "Absent"
    }))

    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    const groupName = selectedGroupId === 'all' ? 'all' : (groups.find(g => g.id === selectedGroupId)?.name || 'group').replace(/\s+/g, '_').toLowerCase()
    
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `attendance_${groupName}_${todayDateString}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleMarkPresent = async (userId: string) => {
    setPresentIds(prev => {
      const next = new Set(prev)
      next.add(userId)
      return next
    })
    setLoadingIds(prev => {
      const next = new Set(prev)
      next.add(userId)
      return next
    })

    const { error } = await supabase.from('attendance').insert({
      user_id: userId,
      date: todayDateString
    })

    if (error) {
      if (error.code === '23505') {
        toast.error('Already marked present today.')
      } else {
        toast.error('Failed to mark attendance', { description: error.message })
        setPresentIds(prev => {
          const next = new Set(prev)
          next.delete(userId)
          return next
        })
      }
    } else {
      toast.success('Attendance marked successfully!')
    }

    setLoadingIds(prev => {
      const next = new Set(prev)
      next.delete(userId)
      return next
    })
  }

  const handleUnmark = async (userId: string) => {
    setPresentIds(prev => {
      const next = new Set(prev)
      next.delete(userId)
      return next
    })
    setLoadingIds(prev => {
      const next = new Set(prev)
      next.add(userId)
      return next
    })

    const { error } = await supabase
      .from('attendance')
      .delete()
      .match({ user_id: userId, date: todayDateString })

    if (error) {
      toast.error('Failed to unmark attendance', { description: error.message })
      setPresentIds(prev => {
        const next = new Set(prev)
        next.add(userId)
        return next
      })
    } else {
      toast.success('Attendance unmarked.')
    }

    setLoadingIds(prev => {
      const next = new Set(prev)
      next.delete(userId)
      return next
    })
  }

  const renderStudentCard = (junior: Junior, isPresent: boolean) => {
    const isLoading = loadingIds.has(junior.id)

    return (
      <Card key={junior.id} className={`transition-colors shadow-sm ${isPresent ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0 w-full">
            <h3 className="text-lg font-bold text-gray-900 truncate">
              {junior.full_name}
            </h3>
            <p className="text-gray-500 text-sm font-mono mt-1">
              {junior.roll_number || 'No Roll Number'}
            </p>
          </div>

          <div className="shrink-0 w-full sm:w-auto">
            {isPresent ? (
              <button
                onClick={() => handleUnmark(junior.id)}
                disabled={isLoading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold border border-green-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors cursor-pointer"
                title="Click to unmark"
              >
                <CheckCircle2 className="w-5 h-5" />
                {isLoading ? 'Updating...' : 'Present'}
              </button>
            ) : (
              <Button 
                onClick={() => handleMarkPresent(junior.id)}
                disabled={isLoading}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-6 rounded-lg shadow-sm"
              >
                {isLoading ? 'Marking...' : 'Mark Present'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Filters and Search */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Select value={selectedGroupId} onValueChange={(val) => setSelectedGroupId(val || 'all')}>
            <SelectTrigger className="w-full md:w-[250px] h-12">
              <SelectValue placeholder="Filter by Group">
                {selectedGroupId === 'all' ? 'All Groups' : (groups.find(g => g.id === selectedGroupId)?.name || 'Filter by Group')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {groups.map(g => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input 
              placeholder="Search by Name or Roll Number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 h-12 text-base border-gray-200 focus:border-blue-500 rounded-lg"
            />
          </div>

          <Button variant="outline" className="h-12 md:w-auto w-full" onClick={exportAttendanceCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
        
        <div className="flex items-center gap-2 bg-blue-50 text-blue-800 px-4 py-3 rounded-lg border border-blue-200">
          <Users className="w-5 h-5" />
          <span className="font-medium text-lg">
            Attendance: <strong className="font-bold">{presentJuniors.length}</strong> / {filteredJuniors.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Absent Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2 mb-4">
            <UserX className="w-5 h-5 text-gray-500" />
            <h2 className="text-xl font-bold text-gray-700">Absent / Unmarked ({absentJuniors.length})</h2>
          </div>
          
          <div className="space-y-3">
            {absentJuniors.map(j => renderStudentCard(j, false))}
            {absentJuniors.length === 0 && (
              <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-gray-100 border-dashed">
                All students are marked present! 🎉
              </div>
            )}
          </div>
        </div>

        {/* Present Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-green-200 pb-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-green-700">Present ({presentJuniors.length})</h2>
          </div>
          
          <div className="space-y-3">
            {presentJuniors.map(j => renderStudentCard(j, true))}
            {presentJuniors.length === 0 && (
              <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-gray-100 border-dashed">
                No students marked present yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
