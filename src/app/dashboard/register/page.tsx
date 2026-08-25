import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import RegistrationForm from '@/components/RegistrationForm'
import JuniorRegistrations from '@/components/JuniorRegistrations'

export default async function JuniorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch regions for dropdowns
  const { data: regions } = await supabase
    .from('regions')
    .select('id, name')
    .order('name', { ascending: true })

  // Fetch only their own registrations with region info
  const { data: registrations } = await supabase
    .from('registrations')
    .select(`
      *,
      regions:region_id (name)
    `)
    .eq('registered_by', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Registration Portal</h1>
        <p className="mt-2 text-gray-600">Log new registrations and track your progress.</p>
      </div>

      <RegistrationForm userId={user.id} regions={regions || []} />

      <JuniorRegistrations registrations={registrations || []} userId={user.id} regions={regions || []} />
    </div>
  )
}
