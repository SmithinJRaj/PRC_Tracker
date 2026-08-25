import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SidebarNav from '@/components/SidebarNav'

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

  if (['junior', 'senior'].includes(profile?.role) && !profile?.group_id) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Pending Assignment</h1>
          <p className="text-gray-600 mb-6">
            Welcome to the PRC Tracker. Please wait for your Senior to assign you to a Region before you can access the dashboard.
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
