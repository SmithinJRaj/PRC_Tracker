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

type LeadData = {
  id?: string
  attendee_name: string
  contact_info: string
  college_name: string | null
  region_id: string | null
}

type Props = {
  initialData?: LeadData
  onSuccess?: () => void
  userId: string
  regions: Region[]
}

export default function LeadForm({ initialData, onSuccess, userId, regions }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [regionId, setRegionId] = useState<string>(initialData?.region_id || '')

  const isEdit = !!initialData?.id

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!regionId) {
      toast.error('Please select a region.')
      return
    }

    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      attendee_name: formData.get('attendee_name') as string,
      contact_info: formData.get('contact_info') as string,
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
        router.refresh()
        if (onSuccess) onSuccess()
      }
    } else {
      // Insert new
      const insertData = {
        ...data,
        lead_status: 'uncontacted',
        registered_by: null // explicit null to match "no registered_by"
      }
      
      const { error } = await supabase.from('registrations').insert(insertData)

      if (error) {
        toast.error('Failed to create lead', { description: error.message })
      } else {
        toast.success('Lead created successfully!')
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
          <div className="space-y-2">
            <Label htmlFor="contact_info">Contact Info (Phone/Email)</Label>
            <Input id="contact_info" name="contact_info" required defaultValue={initialData?.contact_info} placeholder="john@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="college_name">College Name (Optional)</Label>
            <Input id="college_name" name="college_name" defaultValue={initialData?.college_name || ''} placeholder="NIT Calicut" />
          </div>
          <div className="space-y-2">
            <Label>Region</Label>
            <Select value={regionId} onValueChange={setRegionId}>
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

          <Button type="submit" className="w-full mt-4" disabled={loading}>
            {loading ? 'Submitting...' : (isEdit ? 'Save Changes' : 'Create Lead')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
