'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
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
  state: string | null
  contact_info: string
  event_preferences: string[] | null
  payment_status: string | null
  lead_status: string
}

type Props = {
  userId: string
  initialData?: Registration
  isConvert?: boolean
  onSuccess?: () => void
}

export default function RegistrationForm({ userId, initialData, isConvert, onSuccess }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const isEdit = !!initialData?.id && !isConvert

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      attendee_name: formData.get('attendee_name') as string,
      college_name: formData.get('college_name') as string,
      state: formData.get('state') as string,
      contact_info: formData.get('contact_info') as string,
      event_preferences: [formData.get('event_preferences') as string],
      payment_status: formData.get('payment_status') as string,
      registered_by: userId,
      lead_status: 'registered'
    }

    if (initialData?.id) {
      // Update existing
      const { error } = await supabase.from('registrations').update(data).eq('id', initialData.id)
      if (error) {
        toast.error('Failed to update', { description: error.message })
      } else {
        toast.success(isConvert ? 'Lead converted to registration!' : 'Registration updated!')
        router.refresh()
        if (onSuccess) onSuccess()
      }
    } else {
      // Insert new
      const { error } = await supabase.from('registrations').insert(data)
      if (error) {
        toast.error('Failed to register', { description: error.message })
      } else {
        toast.success('Registration added successfully!')
        ;(e.target as HTMLFormElement).reset()
        router.refresh()
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
          {isConvert ? 'Fill in missing details to complete the registration.' : 'Enter details for the attendee.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="attendee_name">Attendee Name</Label>
              <Input id="attendee_name" name="attendee_name" required defaultValue={initialData?.attendee_name} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_info">Contact Info (Phone/Email)</Label>
              <Input id="contact_info" name="contact_info" required defaultValue={initialData?.contact_info} placeholder="john@example.com" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="college_name">College Name</Label>
              <Input id="college_name" name="college_name" required defaultValue={initialData?.college_name || ''} placeholder="NIT Calicut" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" required defaultValue={initialData?.state || ''} placeholder="Kerala" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_preferences">Event Preference</Label>
              <Input id="event_preferences" name="event_preferences" required defaultValue={initialData?.event_preferences?.[0] || ''} placeholder="Tathva '26" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_status">Payment Status</Label>
              <Select name="payment_status" required defaultValue={initialData?.payment_status || "pending"}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full mt-4" disabled={loading}>
            {loading ? 'Submitting...' : (isConvert ? 'Convert Lead' : (isEdit ? 'Save Changes' : 'Add Registration'))}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
