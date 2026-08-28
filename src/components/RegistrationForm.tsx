'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { revalidateDashboard } from '@/app/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

type Registration = {
  id?: string
  attendee_name: string
  college_name: string | null
  phone: string | null
  attendee_email: string | null
  event: string | null
  tathva_id: string | null
  reg_fee: number | null
  lead_status: string
}

type Props = {
  userId: string
  userGroupId: string | null
  initialData?: Registration
  isConvert?: boolean
  onSuccess?: () => void
}

export default function RegistrationForm({ userId, userGroupId, initialData, isConvert, onSuccess }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const phoneRegex = /^(\+\d{1,4})\s?(.*)$/
  let defaultCountryCode = '+91'
  let defaultPhoneNumber = ''
  
  if (initialData?.phone) {
    const match = initialData.phone.match(phoneRegex)
    if (match) {
      defaultCountryCode = match[1]
      defaultPhoneNumber = match[2]
    } else {
      defaultPhoneNumber = initialData.phone
    }
  }

  const [countryCode, setCountryCode] = useState(defaultCountryCode)

  const isEdit = !!initialData?.id && !isConvert
  const disableCreation = !isEdit && !isConvert && !userGroupId

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const phoneInput = formData.get('phone') as string
    const attendee_email = formData.get('attendee_email') as string
    const tathva_id = formData.get('tathva_id') as string
    const reg_fee_str = formData.get('reg_fee') as string
    
    const phone = phoneInput ? `${countryCode}${phoneInput}`.replace(/\s/g, '') : null

    if (!phone && !attendee_email) {
      toast.error('Please provide at least a phone number or an email.')
      return
    }

    if (isConvert && !tathva_id) {
      toast.error('Tathva ID is required to convert a lead to a registration.')
      return
    }

    setLoading(true)

    const data = {
      attendee_name: formData.get('attendee_name') as string,
      college_name: formData.get('college_name') as string,
      phone,
      attendee_email: attendee_email || null,
      event: formData.get('event') as string,
      tathva_id: tathva_id || null,
      reg_fee: reg_fee_str ? Number(reg_fee_str) : 0,
      registered_by: userId,
      lead_status: tathva_id ? 'registered' : (initialData?.lead_status || 'uncontacted')
    }

    if (initialData?.id) {
      // Update existing
      const { error } = await supabase.from('registrations').update(data).eq('id', initialData.id)
      if (error) {
        toast.error('Failed to update', { description: error.message })
      } else {
        toast.success(isConvert ? 'Lead converted to registration!' : 'Registration updated!')
        await revalidateDashboard()
        if (onSuccess) onSuccess()
      }
    } else {
      // Insert new
      const insertData = { ...data, group_id: userGroupId }
      const { error } = await supabase.from('registrations').insert(insertData)
      if (error) {
        toast.error('Failed to register', { description: error.message })
      } else {
        toast.success('Registration added successfully!')
        ;(e.target as HTMLFormElement).reset()
        await revalidateDashboard()
        if (onSuccess) onSuccess()
      }
    }
    setLoading(false)
  }

  return (
    <Card className="w-full shadow-md border-0 sm:border">
      <CardHeader>
        <CardTitle>{isConvert ? 'Convert Lead to Registration' : (isEdit ? 'Edit Registration' : 'New Registration')}</CardTitle>
        <CardDescription>
          {isConvert ? 'Fill in missing details to complete the registration. Tathva ID is required.' : 'Enter details for the attendee.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="attendee_name">Attendee Name</Label>
            <Input id="attendee_name" name="attendee_name" required defaultValue={initialData?.attendee_name} placeholder="John Doe" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <div className="flex gap-2">
                <Select value={countryCode} onValueChange={(val) => setCountryCode(val || '+91')}>
                  <SelectTrigger className="w-[90px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+91">+91</SelectItem>
                    <SelectItem value="+1">+1</SelectItem>
                    <SelectItem value="+44">+44</SelectItem>
                    <SelectItem value="+971">+971</SelectItem>
                  </SelectContent>
                </Select>
                <Input id="phone" name="phone" className="flex-1" defaultValue={defaultPhoneNumber} placeholder="98765 43210" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="attendee_email">Email</Label>
              <Input id="attendee_email" name="attendee_email" type="email" defaultValue={initialData?.attendee_email || ''} placeholder="john@example.com" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="college_name">College Name</Label>
              <Input id="college_name" name="college_name" required defaultValue={initialData?.college_name || ''} placeholder="NIT Calicut" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event">Event Name</Label>
              <Input id="event" name="event" required defaultValue={initialData?.event || ''} placeholder="Proshow" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tathva_id">Tathva ID</Label>
              <Input id="tathva_id" name="tathva_id" defaultValue={initialData?.tathva_id || ''} placeholder="T24-12345" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg_fee">Registration Fee (₹)</Label>
            <Input id="reg_fee" name="reg_fee" type="number" min="0" step="0.01" defaultValue={initialData?.reg_fee || 0} placeholder="0" />
          </div>

          <Button type="submit" className="w-full mt-4" disabled={loading || disableCreation}>
            {loading ? 'Submitting...' : (isConvert ? 'Convert Lead' : (isEdit ? 'Save Changes' : 'Add Registration'))}
          </Button>
          {disableCreation && (
            <p className="text-sm text-red-500 mt-2 text-center">
              You must assign yourself to a Group in the Management tab before creating entries.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
