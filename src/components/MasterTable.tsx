'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { revalidateDashboard } from '@/app/actions'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Modal from './Modal'
import RegistrationForm from './RegistrationForm'
import AlertDialog from './AlertDialog'
import { Download, CheckCircle2, Circle, Edit, Trash2, Mail, Phone, ShieldCheck } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Registration = {
  id: string
  attendee_name: string
  college_name: string | null
  region_id: string | null
  phone: string | null
  attendee_email: string | null
  event: string | null
  tathva_id: string | null
  reg_fee: number | null
  lead_status: string
  created_at: string
  verification_status: string
  can_junior_edit: boolean
  registered_by: string
  users: {
    full_name: string
  } | null
  groups: {
    name: string
  } | null
}

export default function MasterTable({ initialData, role, currentUserId }: { initialData: Registration[], role: string, currentUserId: string }) {
  const [data, setData] = useState<Registration[]>(initialData)
  const [search, setSearch] = useState('')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false)
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null)
  
  const supabase = createClient()
  const router = useRouter()
  const isAdmin = role === 'admin'
  const canManage = role === 'admin' || role === 'senior'

  const filteredData = data.filter(r => 
    r.attendee_name.toLowerCase().includes(search.toLowerCase()) ||
    (r.users?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.phone || '').replace(/\s/g, '').includes(search.replace(/\s/g, '')) ||
    (r.tathva_id || '').toLowerCase().includes(search.toLowerCase())
  )

  const pendingData = filteredData.filter(r => r.verification_status === 'pending' && r.lead_status === 'registered')
  const verifiedData = filteredData.filter(r => r.verification_status === 'verified')

  const totalRegistrations = data.filter(d => d.lead_status === 'registered').length
  const pendingVerifications = data.filter(d => d.verification_status === 'pending' && d.lead_status === 'registered').length
  
  // Analytics Header Fix: Total Events Registered
  const totalEventsRegistered = data.filter(d => d.event && d.event.trim() !== '').length

  const handleVerifyToggle = async (regId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'verified' ? 'pending' : 'verified'
    
    // Optimistic update
    setData(data.map(r => r.id === regId ? { ...r, verification_status: newStatus } : r))
    
    const { error } = await supabase
      .from('registrations')
      .update({ verification_status: newStatus })
      .eq('id', regId)

    if (error) {
      toast.error('Failed to update verification status')
      // Revert on error
      setData(data.map(r => r.id === regId ? { ...r, verification_status: currentStatus } : r))
    } else {
      await revalidateDashboard()
    }
  }

  const handleDeleteRegistration = async () => {
    if (!selectedReg) return
    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('id', selectedReg.id)

    if (error) {
      toast.error('Failed to delete registration', { description: error.message })
    } else {
      toast.success('Registration deleted successfully')
      setData(data.filter(r => r.id !== selectedReg.id))
      await revalidateDashboard()
      router.refresh()
    }
  }

  const openAdminEditModal = (reg: Registration) => {
    setSelectedReg(reg)
    setEditModalOpen(true)
  }

  const openDeleteAlert = (reg: Registration) => {
    setSelectedReg(reg)
    setDeleteAlertOpen(true)
  }

  const exportCSV = () => {
    const headers = ['Attendee Name', 'College', 'Region', 'Phone', 'Email', 'Event', 'Tathva ID', 'Fee', 'Registered By', 'Verification Status', 'Date']
    const csvContent = [
      headers.join(','),
      ...filteredData.map(r => [
        `"${r.attendee_name}"`,
        `"${r.college_name || ''}"`,
        `"${r.groups?.name || ''}"`,
        `"${r.phone || ''}"`,
        `"${r.attendee_email || ''}"`,
        `"${r.event || ''}"`,
        `"${r.tathva_id || ''}"`,
        `"${r.reg_fee || 0}"`,
        `"${r.users?.full_name || 'Unknown'}"`,
        `"${r.verification_status}"`,
        `"${new Date(r.created_at).toLocaleDateString()}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `prc_export_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderMasterTable = (rows: Registration[], showVerifyAction: boolean) => (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Attendee Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>College</TableHead>
            <TableHead>Region</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Fee</TableHead>
            <TableHead>Registered By</TableHead>
            <TableHead>Date</TableHead>
            {canManage && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((reg) => (
            <TableRow key={reg.id}>
              <TableCell>
                {reg.verification_status === 'verified' 
                  ? <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle2 className="w-4 h-4" /> Verified</span>
                  : <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium"><Circle className="w-4 h-4" /> Pending</span>
                }
              </TableCell>
              <TableCell className="font-medium">{reg.attendee_name}</TableCell>
              <TableCell>
                <div className="flex flex-col space-y-1 text-sm text-gray-600">
                  {reg.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-gray-400" />{reg.phone}</span>}
                  {reg.attendee_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-gray-400" />{reg.attendee_email}</span>}
                  {!reg.phone && !reg.attendee_email && <span className="text-gray-400 italic">None</span>}
                </div>
              </TableCell>
              <TableCell>{reg.college_name}</TableCell>
              <TableCell>{reg.groups?.name || 'Unknown'}</TableCell>
              <TableCell>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  {reg.event || 'None'}
                </span>
              </TableCell>
              <TableCell className="font-mono text-gray-700">₹{reg.reg_fee || 0}</TableCell>
              <TableCell className="text-gray-500">{reg.users?.full_name || 'Unknown'}</TableCell>
              <TableCell>{new Date(reg.created_at).toLocaleDateString()}</TableCell>
              {canManage && (
                <TableCell className="text-right">
                  <div className="flex justify-end items-center gap-1">
                    {showVerifyAction && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                        onClick={() => handleVerifyToggle(reg.id, reg.verification_status)}
                      >
                        <ShieldCheck className="w-4 h-4 mr-1" /> Verify
                      </Button>
                    )}
                    {!showVerifyAction && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                        onClick={() => handleVerifyToggle(reg.id, reg.verification_status)}
                      >
                        Unverify
                      </Button>
                    )}
                    {isAdmin && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                        onClick={() => openAdminEditModal(reg)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                      onClick={() => openDeleteAlert(reg)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={canManage ? 10 : 9} className="text-center py-8 text-gray-500">
                No registrations found in this view.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Analytics Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <span className="text-gray-500 text-sm font-medium">Total Registrations</span>
          <span className="text-3xl font-bold text-gray-900 mt-2">{totalRegistrations}</span>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <span className="text-gray-500 text-sm font-medium">Pending Verification</span>
          <span className="text-3xl font-bold text-amber-600 mt-2">{pendingVerifications}</span>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <span className="text-gray-500 text-sm font-medium">Total Events Registered</span>
          <span className="text-3xl font-bold text-blue-600 mt-2">{totalEventsRegistered}</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-gray-900">Master Data</h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Input 
              placeholder="Search name, phone, tathva ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Button variant="outline" onClick={exportCSV} className="flex gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="pending">Pending Verification ({pendingData.length})</TabsTrigger>
            <TabsTrigger value="verified">Verified ({verifiedData.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            {renderMasterTable(pendingData, true)}
          </TabsContent>
          
          <TabsContent value="verified">
            {renderMasterTable(verifiedData, false)}
          </TabsContent>
        </Tabs>
      </div>

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)}>
        {selectedReg && (
          <RegistrationForm 
            userId={selectedReg.registered_by} 
            userGroupId={null}
            initialData={selectedReg as any} 
            onSuccess={() => {
              setEditModalOpen(false)
              router.refresh()
            }}
          />
        )}
      </Modal>

      <AlertDialog 
        isOpen={deleteAlertOpen} 
        onClose={() => setDeleteAlertOpen(false)}
        onConfirm={handleDeleteRegistration}
        title="Delete Registration"
        description="Are you sure? This will permanently delete the registration and cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}
