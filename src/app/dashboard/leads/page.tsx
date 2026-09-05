import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import TelecallingCRM from '@/components/TelecallingCRM'

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, group_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }



  // Fetch base data
  const { data: groups } = await supabase.from('groups').select('id, name')
  const { data: colleges } = await supabase.from('colleges').select('id, name, group_id')
  const { data: users } = await supabase.from('users').select('id, full_name').in('role', ['junior', 'senior', 'admin'])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">CRM & Lead Tracking</h1>
        <p className="mt-2 text-gray-600">Upload CSV lists and track telecalling status.</p>
      </div>

      <TelecallingCRM 
        groups={groups || []}
        colleges={colleges || []}
        users={users || []}
        currentUserId={user.id}
        currentUser={profile}
      />
    </div>
  )
}
