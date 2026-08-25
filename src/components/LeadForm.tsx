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

type Region = {
  id: string
  name: string
}

type LeadData = {
  id?: string
  attendee_name: string
  phone: string | null
  attendee_email: string | null
  college_name: string | null
  region_id: string | null
}

type Props = {
  initialData?: LeadData
  onSuccess?: () => void
  userId: string
  userGroupId: string | null
  regions: Region[]
}

export default function LeadForm({ initialData, onSuccess, userId, userGroupId, regions }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [regionId, setRegionId] = useState<string>(initialData?.region_id || '')
  
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

  const isEdit = !!initialData?.id
  const disableCreation = !isEdit && !userGroupId

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!regionId) {
      toast.error('Please select a region.')
      return
    }

    const formData = new FormData(e.currentTarget)
    const phoneInput = formData.get('phone') as string
    const attendee_email = formData.get('attendee_email') as string
    const phone = phoneInput ? `${countryCode}${phoneInput}`.replace(/\s/g, '') : null

    if (!phone && !attendee_email) {
      toast.error('Please provide at least a phone number or an email.')
      return
    }

    setLoading(true)

    const data = {
      attendee_name: formData.get('attendee_name') as string,
      phone,
      attendee_email: attendee_email || null,
      college_name: formData.get('college_name') as string,
      region_id: regionId
    }

    if (isEdit) {
      // Update existing
      const { error } = await supabase.from('registrations').update(data).eq('id', initialData.id)
      if (error) {
        toast.error('Failed to update lead', { description: error.message })
      } else {
        toast.success('Lead updated!')
        await revalidateDashboard()
        if (onSuccess) onSuccess()
      }
    } else {
      // Insert new
      const insertData = {
        ...data,
        lead_status: 'uncontacted',
        registered_by: null, // explicit null to match "no registered_by"
        group_id: userGroupId
      }
      
      const { error } = await supabase.from('registrations').insert(insertData)

      if (error) {
        toast.error('Failed to create lead', { description: error.message })
      } else {
        toast.success('Lead created successfully!')
        ;(e.target as HTMLFormElement).reset()
        setRegionId('')
        await revalidateDashboard()
        if (onSuccess) onSuccess()
      }
    }
    setLoading(false)
  }

  return (
    <Card className="w-full shadow-md border-0 sm:border">
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Lead' : 'Create New Lead'}</CardTitle>
        <CardDescription>
          {isEdit ? 'Update lead details.' : 'Add a new prospect to the pool.'}
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
          <div className="space-y-2">
            <Label htmlFor="college_name">College Name (Optional)</Label>
            <Input id="college_name" name="college_name" defaultValue={initialData?.college_name || ''} placeholder="NIT Calicut" />
          </div>
          <div className="space-y-2">
            <Label>Region</Label>
            <Select value={regionId} onValueChange={(val) => setRegionId(val || '')}>
              <SelectTrigger>
                <SelectValue>{regions.find(r => r.id === regionId)?.name || 'Select a region...'}</SelectValue>
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

          <Button type="submit" className="w-full mt-4" disabled={loading || disableCreation}>
            {loading ? 'Submitting...' : (isEdit ? 'Save Changes' : 'Create Lead')}
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
