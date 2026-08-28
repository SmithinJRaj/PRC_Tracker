'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
  region_id: string | null
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

  const openEditModal = (reg: Registration) => {
    setSelectedReg(reg)
    setEditModalOpen(true)
  }

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Your Recent Registrations</h2>
        {registrations && registrations.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Attendee Name</TableHead>
                  <TableHead>College</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((reg) => {
                  const isLocked = reg.verification_status === 'verified' || !reg.can_junior_edit
                  return (
                    <TableRow key={reg.id}>
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
          <p className="text-gray-500 text-center py-8">No registrations found. Start logging!</p>
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
