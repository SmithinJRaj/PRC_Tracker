import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SummaryView from '@/components/SummaryView'

export default async function SummaryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!['admin', 'senior'].includes(profile?.role || '')) {
    redirect('/dashboard')
  }

  // Fetch registrations
  const { data: registrations } = await supabase
    .from('registrations')
    .select(`
      id,
      created_at,
      event,
      reg_fee,
      registered_by,
      group_id,
      groups:group_id (name, type)
    `)
    .eq('lead_status', 'registered')

  // Fetch users for active users count
  const { data: users } = await supabase
    .from('users')
    .select(`
      id, 
      group_id, 
      role,
      groups:group_id (name, type)
    `)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Executive Summary</h1>
        <p className="mt-2 text-gray-600">High-level financial tracking and operational analytics.</p>
      </div>

      <SummaryView registrations={registrations as any || []} users={users as any || []} />
    </div>
  )
}
