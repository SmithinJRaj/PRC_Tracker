'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { revalidateDashboard } from '@/app/actions'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Modal from './Modal'
import RegistrationForm from './RegistrationForm'
import LeadForm from './LeadForm'
import AlertDialog from './AlertDialog'
import { Plus, Trash2, Edit, Mail, Phone, Download, Upload, UserPlus } from 'lucide-react'
import Papa from 'papaparse'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

type Lead = {
  id: string
  attendee_name: string
  phone: string | null
  attendee_email: string | null
  college_name: string | null
  region_id: string | null
  event: string | null
  tathva_id: string | null
  lead_status: string
  notes: string | null
  registered_by: string | null
  group_id: string | null
  groups: {
    name: string
  } | null
  is_force_assigned: boolean
}

export default function LeadsTable({ leads, userId, userGroupId, role, users = [], allowedGroupIds = [] }: { leads: Lead[], userId: string, userGroupId: string | null, role: string, users?: {id: string, full_name: string, role?: string, group_id?: string | null}[], allowedGroupIds?: string[] }) {
  const [data, setData] = useState<Lead[]>(leads)
  const [search, setSearch] = useState('')
  const [convertModalOpen, setConvertModalOpen] = useState(false)
  const [leadFormModalOpen, setLeadFormModalOpen] = useState(false)
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [selectedJuniorForAssign, setSelectedJuniorForAssign] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const supabase = createClient()
  const router = useRouter()
  
  const canManage = role === 'admin' || role === 'senior'

  const filteredData = data.filter(l => 
    l.attendee_name.toLowerCase().includes(search.toLowerCase()) ||
    (l.phone || '').replace(/\s/g, '').includes(search.replace(/\s/g, '')) ||
    (l.attendee_email || '').toLowerCase().includes(search.toLowerCase())
  )

  const availableLeads = filteredData.filter(l => l.registered_by === null)
  const myLeads = filteredData.filter(l => l.registered_by === userId)
  const teamLeads = filteredData.filter(l => l.registered_by !== null && l.registered_by !== userId)
  
  const userMap = Object.fromEntries(users.map(u => [u.id, u.full_name]))
  
  const manageableJuniors = users.filter(u => u.role === 'junior' && u.group_id && (role === 'admin' || allowedGroupIds.includes(u.group_id)))

  const handleAssign = async () => {
    if (!selectedLead || !selectedJuniorForAssign) return

    const { error } = await supabase
      .from('registrations')
      .update({ registered_by: selectedJuniorForAssign, is_force_assigned: true })
      .eq('id', selectedLead.id)

    if (error) {
      toast.error('Failed to assign lead', { description: error.message })
    } else {
      toast.success('Lead assigned successfully!')
      setData(data.map(l => l.id === selectedLead.id ? { ...l, registered_by: selectedJuniorForAssign, is_force_assigned: true } : l))
      setAssignModalOpen(false)
      setSelectedJuniorForAssign('')
      await revalidateDashboard()
      router.refresh()
    }
  }

  const openAssignModal = (lead: Lead) => {
    setSelectedLead(lead)
    setSelectedJuniorForAssign('')
    setAssignModalOpen(true)
  }

  const handleClaim = async (leadId: string) => {
    const { error } = await supabase
      .from('registrations')
      .update({ registered_by: userId })
      .eq('id', leadId)

    if (error) {
      toast.error('Failed to claim lead', { description: error.message })
    } else {
      toast.success('Lead claimed successfully!')
      setData(data.map(l => l.id === leadId ? { ...l, registered_by: userId } : l))
      await revalidateDashboard()
      router.refresh()
    }
  }

  const handleUnclaim = async (leadId: string) => {
    const { error } = await supabase
      .from('registrations')
      .update({ registered_by: null, lead_status: 'uncontacted' })
      .eq('id', leadId)

    if (error) {
      toast.error('Failed to unclaim lead', { description: error.message })
    } else {
      toast.success('Lead unclaimed successfully!')
      setData(data.map(l => l.id === leadId ? { ...l, registered_by: null, lead_status: 'uncontacted' } : l))
      await revalidateDashboard()
      router.refresh()
    }
  }

  const handleStatusChange = async (leadId: string, status: string) => {
    const { error } = await supabase
      .from('registrations')
      .update({ lead_status: status })
      .eq('id', leadId)

    if (error) {
      toast.error('Failed to update status', { description: error.message })
    } else {
      toast.success('Status updated!')
      setData(data.map(l => l.id === leadId ? { ...l, lead_status: status } : l))
      await revalidateDashboard()
    }
  }

  const handleNotesChange = async (leadId: string, notes: string) => {
    const { error } = await supabase
      .from('registrations')
      .update({ notes })
      .eq('id', leadId)

    if (error) {
      toast.error('Failed to save notes')
    } else {
      setData(data.map(l => l.id === leadId ? { ...l, notes } : l))
      await revalidateDashboard()
    }
  }

  const handleDeleteLead = async () => {
    if (!selectedLead) return
    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('id', selectedLead.id)

    if (error) {
      toast.error('Failed to delete lead', { description: error.message })
    } else {
      toast.success('Lead deleted successfully')
      setData(data.filter(l => l.id !== selectedLead.id))
      await revalidateDashboard()
      router.refresh()
    }
  }

  const openConvertModal = (lead: Lead) => {
    setSelectedLead(lead)
    setConvertModalOpen(true)
  }

  const openEditModal = (lead: Lead) => {
    setSelectedLead(lead)
    setLeadFormModalOpen(true)
  }

  const openCreateModal = () => {
    setSelectedLead(null)
    setLeadFormModalOpen(true)
  }

  const openDeleteAlert = (lead: Lead) => {
    setSelectedLead(lead)
    setDeleteAlertOpen(true)
  }

  const handleExportCSV = () => {
    const csv = Papa.unparse(data.map(l => ({
      'Attendee Name': l.attendee_name,
      'College Name': l.college_name || '',
      'Phone': l.phone || '',
      'Email': l.attendee_email || '',
      'Event': l.event || '',
      'Status': l.lead_status,
      'Registered By': l.registered_by === userId ? 'Me' : l.registered_by ? 'Others' : 'Unclaimed',
      'Notes': l.notes || ''
    })))
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'leads_export.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[]
        const requiredHeaders = ['attendee_name', 'college_name', 'phone', 'attendee_email']
        const hasAllHeaders = requiredHeaders.every(h => results.meta.fields?.includes(h))

        if (!hasAllHeaders) {
          toast.error('Invalid CSV format', { description: 'Missing required headers.' })
          setIsImporting(false)
          return
        }

        const payload = rows.map(r => ({
          attendee_name: r.attendee_name,
          college_name: r.college_name || null,
          phone: r.phone || null,
          attendee_email: r.attendee_email || null,
          lead_status: 'uncontacted',
          verification_status: 'pending',
          group_id: userGroupId,
          registered_by: null
        }))

        const { error } = await supabase.from('registrations').insert(payload)

        if (error) {
          toast.error('Failed to import CSV', { description: error.message })
        } else {
          toast.success('Leads imported successfully!')
          setImportModalOpen(false)
          await revalidateDashboard()
          router.refresh()
        }
        setIsImporting(false)
      },
      error: (error) => {
        toast.error('Failed to parse CSV', { description: error.message })
        setIsImporting(false)
      }
    })
    e.target.value = ''
  }

  const renderTable = (leadsToRender: Lead[], viewContext: 'available' | 'my' | 'team') => (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Attendee Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Region</TableHead>
            {viewContext === 'team' && <TableHead>Claimed By</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead className="w-[300px]">Notes</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leadsToRender.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">{lead.attendee_name}</TableCell>
              <TableCell>
                <div className="flex flex-col space-y-1 text-sm text-gray-600">
                  {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-gray-400" />{lead.phone}</span>}
                  {lead.attendee_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-gray-400" />{lead.attendee_email}</span>}
                  {!lead.phone && !lead.attendee_email && <span className="text-gray-400 italic">None</span>}
                </div>
              </TableCell>
              <TableCell>{lead.groups?.name || 'Unknown'}</TableCell>
              {viewContext === 'team' && (
                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {lead.registered_by ? (userMap[lead.registered_by] || 'Unknown User') : 'None'}
                  </span>
                </TableCell>
              )}
              <TableCell>
                <Select 
                  value={lead.lead_status} 
                  onValueChange={(val) => handleStatusChange(lead.id, val || "uncontacted")}
                  disabled={lead.registered_by !== userId && !canManage}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uncontacted">Uncontacted</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <textarea 
                  className="w-full text-sm p-2 border rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  defaultValue={lead.notes || ''}
                  placeholder="Add notes..."
                  rows={2}
                  disabled={lead.registered_by !== userId && !canManage}
                  onBlur={(e) => handleNotesChange(lead.id, e.target.value)}
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end items-center gap-2">
                  {lead.registered_by === userId ? (
                    <div className="flex gap-2">
                      <Button variant="default" size="sm" onClick={() => openConvertModal(lead)}>
                        Convert
                      </Button>
                      <div className="relative group/unclaim">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleUnclaim(lead.id)} 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 disabled:opacity-50"
                          disabled={lead.is_force_assigned && role === 'junior'}
                        >
                          Unclaim
                        </Button>
                        {lead.is_force_assigned && role === 'junior' && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/unclaim:block w-32 p-2 bg-gray-900 text-white text-xs text-center rounded-md shadow-lg z-50 whitespace-nowrap">
                            Assigned by Manager
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleClaim(lead.id)} disabled={lead.registered_by !== null}>
                        Claim
                      </Button>
                      {canManage && (viewContext === 'available' || viewContext === 'team') && (
                        <Button variant="outline" size="sm" onClick={() => openAssignModal(lead)} className="px-2" title="Assign to Junior">
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {canManage && (
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                        onClick={() => openEditModal(lead)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                        onClick={() => openDeleteAlert(lead)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {leadsToRender.length === 0 && (
            <TableRow>
              <TableCell colSpan={viewContext === 'team' ? 7 : 6} className="text-center py-8 text-gray-500">
                No active leads found in this view.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold text-gray-900">Lead Tracking</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Input 
            placeholder="Search leads..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportModalOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportCSV}
            />
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <div className="relative group">
              <Button 
                onClick={openCreateModal}
                disabled={!userGroupId}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Lead
              </Button>
              {!userGroupId && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs text-center rounded-md shadow-lg z-50">
                  You must be assigned to a Group in the Management tab to create leads.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="available" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="available">Available Pool ({availableLeads.length})</TabsTrigger>
          <TabsTrigger value="my">My Workspace ({myLeads.length})</TabsTrigger>
          {(role === 'admin' || role === 'senior') && (
            <TabsTrigger value="team">Team Claims ({teamLeads.length})</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="available">
          {renderTable(availableLeads, 'available')}
        </TabsContent>
        
        <TabsContent value="my">
          {renderTable(myLeads, 'my')}
        </TabsContent>
        
        {(role === 'admin' || role === 'senior') && (
          <TabsContent value="team">
            {renderTable(teamLeads, 'team')}
          </TabsContent>
        )}
      </Tabs>

      <Modal isOpen={convertModalOpen} onClose={() => setConvertModalOpen(false)}>
        {selectedLead && (
          <RegistrationForm 
            userId={userId} 
            userGroupId={userGroupId}
            initialData={selectedLead as any} 
            isConvert={true} 
            onSuccess={() => {
              setConvertModalOpen(false)
              setData(data.filter(l => l.id !== selectedLead.id))
            }}
          />
        )}
      </Modal>
      
      <Modal isOpen={leadFormModalOpen} onClose={() => setLeadFormModalOpen(false)}>
        <LeadForm 
          userId={userId} 
          userGroupId={userGroupId}
          initialData={selectedLead || undefined} 
          onSuccess={() => {
            setLeadFormModalOpen(false)
          }}
        />
      </Modal>

      <AlertDialog 
        isOpen={deleteAlertOpen} 
        onClose={() => setDeleteAlertOpen(false)}
        onConfirm={handleDeleteLead}
        title="Delete Lead"
        description="Are you sure? This will permanently delete the lead and cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />

      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Leads from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file to bulk import leads into the system.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-gray-50 border rounded-md">
            <p className="text-sm font-semibold text-gray-700 mb-2">Required exact headers:</p>
            <ul className="list-disc pl-5 text-sm text-gray-600 font-mono space-y-1">
              <li>attendee_name</li>
              <li>college_name</li>
              <li>phone</li>
              <li>attendee_email</li>
            </ul>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full h-12"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? 'Importing...' : 'Choose CSV File'}
            </Button>
            {isImporting && <p className="text-sm text-blue-600 text-center">Processing your file...</p>}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Lead</DialogTitle>
            <DialogDescription>
              Force-assign this lead to a junior in your team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Select value={selectedJuniorForAssign} onValueChange={(val) => setSelectedJuniorForAssign(val || '')}>
              <SelectTrigger>
                <SelectValue placeholder="Select a Junior" />
              </SelectTrigger>
              <SelectContent>
                {manageableJuniors.length > 0 ? (
                  manageableJuniors.map(j => (
                    <SelectItem key={j.id} value={j.id}>{j.full_name}</SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No eligible juniors found</SelectItem>
                )}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleAssign} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!selectedJuniorForAssign || selectedJuniorForAssign === 'none'}
            >
              Confirm Assignment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
