import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SidebarNav from '@/components/SidebarNav'
import OnboardingGate from '@/components/OnboardingGate'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Ban Gate
  if (profile?.is_banned) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-red-200 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-700 mb-2">Account Suspended</h1>
          <p className="text-gray-600 mb-6">
            Your account has been suspended by an administrator. Please contact your Senior or Admin for assistance.
          </p>
          <form action="/auth/signout" method="post">
            <button type="submit" className="text-blue-600 hover:underline font-medium">
              Sign Out
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Onboarding Gate — Junior/Senior with no group gets self-service assignment
  if (['junior', 'senior'].includes(profile?.role) && !profile?.group_id) {
    const { data: allGroups } = await supabase
      .from('groups')
      .select('id, name, type')
      .order('name', { ascending: true })

    return <OnboardingGate userId={user.id} groups={allGroups || []} role={profile.role} />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <SidebarNav role={profile?.role || 'junior'} fullName={profile?.full_name || 'Unknown User'} />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 w-full overflow-x-hidden">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
