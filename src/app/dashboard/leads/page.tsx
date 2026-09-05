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
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  if (profile.role !== 'admin') {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-amber-200">
            <span className="text-4xl">🚧</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Work in Progress</h1>
          <p className="text-gray-600 text-lg">
            The Leads CRM is currently undergoing maintenance and upgrades. This feature is temporarily locked for non-admins.
          </p>
          <div className="pt-4">
            <a 
              href="/dashboard/register" 
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    )
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
      />
    </div>
  )
}
