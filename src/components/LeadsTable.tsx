'use client'

import { useState } from 'react'
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
import { Plus, Trash2, Edit, Mail, Phone } from 'lucide-react'

type Region = {
  id: string
  name: string
}

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
}

export default function LeadsTable({ leads, userId, userGroupId, role, regions }: { leads: Lead[], userId: string, userGroupId: string | null, role: string, regions: Region[] }) {
  const [data, setData] = useState<Lead[]>(leads)
  const [search, setSearch] = useState('')
  const [convertModalOpen, setConvertModalOpen] = useState(false)
  const [leadFormModalOpen, setLeadFormModalOpen] = useState(false)
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  
  const supabase = createClient()
  const router = useRouter()
  
  const canManage = role === 'admin' || role === 'senior'

  const filteredData = data.filter(l => 
    l.attendee_name.toLowerCase().includes(search.toLowerCase()) ||
    (l.phone || '').replace(/\s/g, '').includes(search.replace(/\s/g, '')) ||
    (l.attendee_email || '').toLowerCase().includes(search.toLowerCase())
  )

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
          {canManage && (
            <div className="relative group">
              <Button onClick={openCreateModal} className="flex items-center gap-2" disabled={!userGroupId}>
                <Plus className="w-4 h-4" /> Create Lead
              </Button>
              {!userGroupId && (
                <div className="absolute top-full mt-2 right-0 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10 text-center">
                  You must assign yourself to a Group in the Management tab before creating entries.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Attendee Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[300px]">Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((lead) => (
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
                      <Button variant="default" size="sm" onClick={() => openConvertModal(lead)}>
                        Convert
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => handleClaim(lead.id)}>
                        Claim
                      </Button>
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
            {filteredData.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No active leads found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
            regions={regions}
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
          regions={regions}
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
    </div>
  )
}
