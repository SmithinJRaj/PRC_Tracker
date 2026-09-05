'use client'

import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Check, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Group {
  id: string
  name: string
}

interface College {
  id: string
  name: string
  group_id: string
}

interface User {
  id: string
  full_name: string
}

interface Lead {
  id: string
  college_id: string
  phone_number: string
  status: string
  remarks: string | null
  called_by: string | null
  is_confirmed: boolean
}

export default function TelecallingCRM({
  groups,
  colleges: initialColleges,
  users,
  currentUserId,
  currentUser
}: {
  groups: Group[]
  colleges: College[]
  users: User[]
  currentUserId: string
  currentUser: any
}) {
  const supabase = createClient()
  const router = useRouter()
  const [colleges, setColleges] = useState<College[]>(initialColleges)

  const displayGroups = currentUser.role === 'admin' ? groups : groups.filter(g => g.id === currentUser.group_id)

  // Data Entry State
  const [isNewCollege, setIsNewCollege] = useState(false)
  const [newCollegeName, setNewCollegeName] = useState('')
  const [entryGroupId, setEntryGroupId] = useState(currentUser.role !== 'admin' ? currentUser.group_id : '')
  const [entryCollegeId, setEntryCollegeId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Tracking State
  const [trackGroupId, setTrackGroupId] = useState(currentUser.role !== 'admin' ? currentUser.group_id : '')
  const [trackCollegeId, setTrackCollegeId] = useState('')
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoadingLeads, setIsLoadingLeads] = useState(false)

  // Fetch leads when trackCollegeId changes
  useEffect(() => {
    async function fetchLeads() {
      if (!trackCollegeId) {
        setLeads([])
        return
      }
      setIsLoadingLeads(true)
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('college_id', trackCollegeId)
        .order('id', { ascending: true })

      if (error) {
        toast.error('Failed to load leads')
      } else {
        setLeads(data || [])
      }
      setIsLoadingLeads(false)
    }
    fetchLeads()
  }, [trackCollegeId, supabase])

  const handleFileUpload = async () => {
    if (!file) {
      toast.error('Please select a CSV file.')
      return
    }

    if (isNewCollege && (!newCollegeName || !entryGroupId)) {
      toast.error('Please provide a college name and group.')
      return
    }

    if (!isNewCollege && (!entryGroupId || !entryCollegeId)) {
      toast.error('Please select an existing college.')
      return
    }

    setIsUploading(true)

    Papa.parse(file, {
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rawText = results.data.map(row => (row as any[]).join(' ')).join(' ')
          const phoneRegex = /\b\d{10}\b/g
          const matches = rawText.match(phoneRegex) || []
          const uniquePhones = Array.from(new Set(matches))

          if (uniquePhones.length === 0) {
            toast.error('No valid 10-digit phone numbers found in the CSV.')
            setIsUploading(false)
            return
          }

          let targetCollegeId = entryCollegeId

          if (isNewCollege) {
            const { data: newCollege, error: collegeError } = await supabase
              .from('colleges')
              .insert({ name: newCollegeName, group_id: entryGroupId })
              .select('id')
              .single()

            if (collegeError) throw collegeError
            targetCollegeId = newCollege.id
            // Optimistically update colleges
            setColleges([...colleges, { id: newCollege.id, name: newCollegeName, group_id: entryGroupId }])
          }

          const payload = uniquePhones.map(phone => ({
            college_id: targetCollegeId,
            phone_number: phone,
            status: 'uncalled'
          }))

          const { error: insertError } = await supabase.from('leads').insert(payload)
          if (insertError) {
             // Handle unique constraint if needed, but for now just throw
             throw insertError
          }

          toast.success(`Successfully imported ${uniquePhones.length} leads.`)
          setFile(null)
          setNewCollegeName('')
          
          // Refresh if tracking this college
          if (trackCollegeId === targetCollegeId) {
            const { data: freshLeads } = await supabase.from('leads').select('*').eq('college_id', targetCollegeId).order('id', { ascending: true })
            if (freshLeads) setLeads(freshLeads)
          }

        } catch (error: any) {
          console.error(error)
          toast.error(error.message || 'Failed to import leads.')
        } finally {
          setIsUploading(false)
        }
      }
    })
  }

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    // Optimistic update
    setLeads(leads.map(l => l.id === id ? { ...l, ...updates } : l))

    const { error } = await supabase.from('leads').update(updates).eq('id', id)
    if (error) {
      toast.error('Failed to update lead')
      // Refresh to revert on error
      const { data } = await supabase.from('leads').select('*').eq('college_id', trackCollegeId)
      if (data) setLeads(data)
    }
  }

  const uncalledLeads = leads.filter(l => l.status === 'uncalled')
  const calledLeads = leads.filter(l => l.status === 'called')

  return (
    <div className="space-y-8">
      {/* Data Entry Section */}
      <Card>
        <CardHeader>
          <CardTitle>Data Entry</CardTitle>
          <CardDescription>Upload leads via CSV for a college.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Button variant={isNewCollege ? 'default' : 'outline'} onClick={() => setIsNewCollege(true)}>
              Create New College
            </Button>
            <Button variant={!isNewCollege ? 'default' : 'outline'} onClick={() => setIsNewCollege(false)}>
              Add to Existing
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Select value={entryGroupId} onValueChange={(val) => setEntryGroupId(val || '')} disabled={currentUser.role !== 'admin'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Group">
                     {entryGroupId ? displayGroups.find(g => g.id === entryGroupId)?.name : "Select Group"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {displayGroups.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isNewCollege ? (
              <div className="space-y-2">
                <Input 
                  placeholder="College Name" 
                  value={newCollegeName}
                  onChange={(e) => setNewCollegeName(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Select value={entryCollegeId} onValueChange={(val) => setEntryCollegeId(val || '')} disabled={!entryGroupId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select College">
                      {entryCollegeId ? colleges.find(c => c.id === entryCollegeId)?.name : "Select College"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {colleges.filter(c => c.group_id === entryGroupId).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Input 
                type="file" 
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700" 
            onClick={handleFileUpload}
            disabled={isUploading || !file}
          >
            {isUploading ? 'Processing...' : 'Upload & Import'}
          </Button>
        </CardContent>
      </Card>

      {/* Tracking Section */}
      <Card>
        <CardHeader>
          <CardTitle>Split-View Tracking</CardTitle>
          <CardDescription>Manage leads for a selected college.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 max-w-md flex flex-col md:flex-row gap-4">
            <Select value={trackGroupId} onValueChange={(val) => {
              setTrackGroupId(val || '');
              setTrackCollegeId('');
            }} disabled={currentUser.role !== 'admin'}>
              <SelectTrigger>
                <SelectValue placeholder="Select Group">
                   {trackGroupId ? displayGroups.find(g => g.id === trackGroupId)?.name : "Select Group"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {displayGroups.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={trackCollegeId} onValueChange={(val) => setTrackCollegeId(val || '')} disabled={!trackGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Select College to track">
                   {trackCollegeId ? colleges.find(c => c.id === trackCollegeId)?.name : "Select College"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {colleges.filter(c => c.group_id === trackGroupId).map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoadingLeads ? (
            <p className="text-gray-500">Loading leads...</p>
          ) : trackCollegeId ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Uncalled Box */}
              <div className="border rounded-lg overflow-hidden flex flex-col max-h-[600px]">
                <div className="bg-gray-50 p-3 border-b font-medium flex justify-between">
                  <span>Uncalled Leads</span>
                  <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-sm">
                    {uncalledLeads.length}
                  </span>
                </div>
                <div className="overflow-y-auto flex-1 p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Remarks</TableHead>
                        <TableHead className="w-24 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uncalledLeads.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-gray-500 h-24">
                            No uncalled leads
                          </TableCell>
                        </TableRow>
                      ) : uncalledLeads.map((lead, idx) => (
                        <TableRow key={lead.id}>
                          <TableCell className="text-gray-500 text-xs">{idx + 1}</TableCell>
                          <TableCell className="font-mono">{lead.phone_number}</TableCell>
                          <TableCell>
                            <Input 
                              defaultValue={lead.remarks || ''} 
                              onBlur={(e) => updateLead(lead.id, { remarks: e.target.value })}
                              placeholder="Add note..."
                              className="h-8 text-xs"
                            />
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button 
                              size="icon" 
                              variant="outline" 
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => updateLead(lead.id, { status: 'called', called_by: currentUserId })}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="outline" 
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => updateLead(lead.id, { status: 'invalid' })}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Called Box */}
              <div className="border rounded-lg overflow-hidden flex flex-col max-h-[600px]">
                <div className="bg-gray-50 p-3 border-b font-medium flex justify-between">
                  <span>Called Leads</span>
                  <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-sm">
                    {calledLeads.length}
                  </span>
                </div>
                <div className="overflow-y-auto flex-1 p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Called By</TableHead>
                        <TableHead>Remarks</TableHead>
                        <TableHead className="w-20 text-center">Done</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calledLeads.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500 h-24">
                            No called leads
                          </TableCell>
                        </TableRow>
                      ) : calledLeads.map((lead, idx) => (
                        <TableRow key={lead.id}>
                          <TableCell className="text-gray-500 text-xs">{idx + 1}</TableCell>
                          <TableCell className="font-mono">{lead.phone_number}</TableCell>
                          <TableCell>
                            <Select 
                              value={lead.called_by || ''} 
                              onValueChange={(val) => updateLead(lead.id, { called_by: val || null })}
                            >
                              <SelectTrigger className="h-8 text-xs border-0 bg-transparent p-0 w-24">
                                <SelectValue placeholder="Assign">
                                  <span className="truncate block max-w-[80px]">
                                    {lead.called_by ? users.find(u => u.id === lead.called_by)?.full_name : 'Assign'}
                                  </span>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {users.map(u => (
                                  <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input 
                              defaultValue={lead.remarks || ''} 
                              onBlur={(e) => updateLead(lead.id, { remarks: e.target.value })}
                              placeholder="Add note..."
                              className="h-8 text-xs"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <input 
                              type="checkbox" 
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={lead.is_confirmed || false}
                              onChange={(e) => updateLead(lead.id, { is_confirmed: e.target.checked })}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12 border-2 border-dashed rounded-lg">
              Select a college to view and manage leads.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
