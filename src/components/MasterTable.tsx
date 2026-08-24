'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Modal from './Modal'
import RegistrationForm from './RegistrationForm'
import AlertDialog from './AlertDialog'
import { Download, CheckCircle2, Circle, Edit, Trash2 } from 'lucide-react'

type Registration = {
  id: string
  attendee_name: string
  college_name: string | null
  state: string | null
  contact_info: string
  event_preferences: string[] | null
  payment_status: string | null
  lead_status: string
  created_at: string
  verification_status: string
  can_junior_edit: boolean
  registered_by: string
  users: {
    full_name: string
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
    (r.users?.full_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalRegistrations = data.filter(d => d.lead_status === 'registered').length
  const pendingVerifications = data.filter(d => d.verification_status === 'pending' && d.lead_status === 'registered').length
  const totalPaid = data.filter(d => d.payment_status === 'paid').length

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
    const headers = ['Attendee Name', 'College', 'Contact Info', 'Registered By', 'Payment Status', 'Verification Status', 'Date']
    const csvContent = [
      headers.join(','),
      ...filteredData.map(r => [
        `"${r.attendee_name}"`,
        `"${r.college_name || ''}"`,
        `"${r.contact_info}"`,
        `"${r.users?.full_name || 'Unknown'}"`,
        `"${r.payment_status || 'unknown'}"`,
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
          <span className="text-gray-500 text-sm font-medium">Paid Registrations</span>
          <span className="text-3xl font-bold text-green-600 mt-2">{totalPaid}</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-gray-900">Master Data</h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Input 
              placeholder="Search attendee or junior..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Button variant="outline" onClick={exportCSV} className="flex gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Verify</TableHead>
                <TableHead>Attendee Name</TableHead>
                <TableHead>College</TableHead>
                <TableHead>Registered By</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Date</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell>
                    <button 
                      onClick={() => handleVerifyToggle(reg.id, reg.verification_status)}
                      className="focus:outline-none transition-colors"
                      title={reg.verification_status === 'verified' ? 'Verified (Locked)' : 'Pending Verification'}
                    >
                      {reg.verification_status === 'verified' 
                        ? <CheckCircle2 className="w-6 h-6 text-green-500" />
                        : <Circle className="w-6 h-6 text-gray-300 hover:text-gray-400" />
                      }
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">{reg.attendee_name}</TableCell>
                  <TableCell>{reg.college_name}</TableCell>
                  <TableCell className="text-gray-500">{reg.users?.full_name || 'Unknown'}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      reg.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {reg.payment_status?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(reg.created_at).toLocaleDateString()}</TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1">
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
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canManage ? 7 : 6} className="text-center py-8 text-gray-500">
                    No registrations found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)}>
        {selectedReg && (
          <RegistrationForm 
            userId={selectedReg.registered_by} 
            initialData={selectedReg} 
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
