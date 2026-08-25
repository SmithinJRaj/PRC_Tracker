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

type Region = {
  id: string
  name: string
}

type Registration = {
  id?: string
  attendee_name: string
  college_name: string | null
  phone: string | null
  attendee_email: string | null
  event: string | null
  tathva_id: string | null
  region_id: string | null
  lead_status: string
}

type Props = {
  userId: string
  initialData?: Registration
  isConvert?: boolean
  onSuccess?: () => void
  regions: Region[]
}

export default function RegistrationForm({ userId, initialData, isConvert, onSuccess, regions }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [regionId, setRegionId] = useState<string>(initialData?.region_id || '')

  const isEdit = !!initialData?.id && !isConvert

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!regionId) {
      toast.error('Please select a region.')
      return
    }

    const formData = new FormData(e.currentTarget)
    const phone = formData.get('phone') as string
    const attendee_email = formData.get('attendee_email') as string
    const tathva_id = formData.get('tathva_id') as string

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
      phone: phone || null,
      attendee_email: attendee_email || null,
      event: formData.get('event') as string,
      tathva_id: tathva_id || null,
      region_id: regionId,
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
        setRegionId('')
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
              <Input id="phone" name="phone" defaultValue={initialData?.phone || ''} placeholder="+91 9876543210" />
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
            <div className="space-y-2">
              <Label>Region</Label>
              <Select value={regionId} onValueChange={(val) => setRegionId(val || '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a region..." />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <Button type="submit" className="w-full mt-4" disabled={loading}>
            {loading ? 'Submitting...' : (isConvert ? 'Convert Lead' : (isEdit ? 'Save Changes' : 'Add Registration'))}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
