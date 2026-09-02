import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import GroupsManager from '@/components/GroupsManager'

export default async function GroupsPage() {
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

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: allGroups } = await supabase
    .from('groups')
    .select('*')
    .order('name', { ascending: true })

  const { data: allUsers } = await supabase
    .from('users')
    .select('id, full_name, role, group_id')
    .order('full_name', { ascending: true })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Groups Manager</h1>
        <p className="mt-2 text-gray-600">Create, edit, and manage group hierarchies.</p>
      </div>

      <GroupsManager 
        initialGroups={allGroups || []} 
        users={allUsers || []} 
      />
    </div>
  )
}
