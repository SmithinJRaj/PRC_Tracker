'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Modal from './Modal'
import RegistrationForm from './RegistrationForm'

type Registration = {
  id: string
  attendee_name: string
  college_name: string | null
  phone: string | null
  attendee_email: string | null
  event: string | null
  tathva_id: string | null
  reg_fee: number | null
  lead_status: string
  created_at: string
  verification_status: string
  can_junior_edit: boolean
  groups: {
    name: string
  } | null
}

export default function JuniorRegistrations({ registrations, userId, userGroupId }: { registrations: Registration[], userId: string, userGroupId: string | null }) {
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null)
  const [searchColumn, setSearchColumn] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const openEditModal = (reg: Registration) => {
    setSelectedReg(reg)
    setEditModalOpen(true)
  }

  const filteredRegistrations = registrations.filter(reg => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()

    switch (searchColumn) {
      case 'name':
        return reg.attendee_name.toLowerCase().includes(query)
      case 'college':
        return (reg.college_name || '').toLowerCase().includes(query)
      case 'date':
        return new Date(reg.created_at).toLocaleDateString().includes(query)
      default: // 'all'
        return (
          reg.attendee_name.toLowerCase().includes(query) ||
          (reg.college_name || '').toLowerCase().includes(query) ||
          new Date(reg.created_at).toLocaleDateString().includes(query) ||
          (reg.event || '').toLowerCase().includes(query)
        )
    }
  })

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h2 className="text-xl font-semibold text-gray-900">Your Registration Log</h2>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm font-medium text-blue-700">Total Registrations:</span>
            <span className="text-xl font-bold text-blue-800">{registrations.length}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Select value={searchColumn} onValueChange={(val) => setSearchColumn(val || 'all')}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Columns</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="college">College</SelectItem>
              <SelectItem value="date">Date</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder={`Search${searchColumn !== 'all' ? ` by ${searchColumn}` : ''}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
        </div>

        {filteredRegistrations.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Sl. No.</TableHead>
                  <TableHead>Attendee Name</TableHead>
                  <TableHead>College</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((reg, index) => {
                  const isLocked = reg.verification_status === 'verified' || !reg.can_junior_edit
                  return (
                    <TableRow key={reg.id}>
                      <TableCell className="text-gray-500 font-mono text-sm">{index + 1}</TableCell>
                      <TableCell className="font-medium">{reg.attendee_name}</TableCell>
                      <TableCell>{reg.college_name}</TableCell>
                      <TableCell>{reg.groups?.name || 'Unknown'}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {reg.event || 'None'}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(reg.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={isLocked}
                          onClick={() => openEditModal(reg)}
                        >
                          {isLocked ? 'Locked' : 'Edit'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            {searchQuery ? 'No registrations match your search.' : 'No registrations found. Start logging!'}
          </p>
        )}
      </div>

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)}>
        {selectedReg && (
          <RegistrationForm 
            userId={userId} 
            userGroupId={userGroupId}
            initialData={selectedReg} 
            onSuccess={() => setEditModalOpen(false)}
          />
        )}
      </Modal>
    </>
  )
}
