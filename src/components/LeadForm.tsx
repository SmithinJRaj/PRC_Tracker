'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

type LeadData = {
  id?: string
  attendee_name: string
  contact_info: string
  college_name: string | null
}

type Props = {
  initialData?: LeadData
  onSuccess?: () => void
  groupId?: string | null
  userId: string
}

export default function LeadForm({ initialData, onSuccess, groupId, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const isEdit = !!initialData?.id

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      attendee_name: formData.get('attendee_name') as string,
      contact_info: formData.get('contact_info') as string,
      college_name: formData.get('college_name') as string,
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
        registered_by: userId, // The creator claims it initially, or maybe it should be null?
        // Wait, if an admin creates a lead for a group, how do they assign it to a group?
        // They might just insert it as their own lead, or maybe we just let it be unassigned if admin, or claimed by the creator.
        // The prompt says "Seniors and Admins to manually insert a new row with lead_status = 'uncontacted'".
        // The prompt also says "Seniors and Juniors should only see leads assigned to their group_id. Admins see global leads."
        // And user clarified "For now, assume leads are assigned to groups strictly based on the group_id of the user (Junior/Senior) who claims or creates them. If a row has no registered_by, only Admins should see it in the pool until it is claimed."
        // So we just set registered_by to null initially, and Admins can see it. But if a Senior creates it, they should probably claim it so it gets their group_id, or they can leave it unclaimed. 
        // Let's set registered_by to null, so it's unclaimed.
      }
      
      const { error } = await supabase.from('registrations').insert({
        ...insertData,
        registered_by: null // explicit null to match "no registered_by"
      })

      if (error) {
        toast.error('Failed to create lead', { description: error.message })
      } else {
        toast.success('Lead created successfully!')
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

          <Button type="submit" className="w-full mt-4" disabled={loading}>
            {loading ? 'Submitting...' : (isEdit ? 'Save Changes' : 'Create Lead')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
