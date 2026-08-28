import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import LeaderboardView from '@/components/LeaderboardView'

export default async function LeaderboardPage() {
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

  // Call the secure RPC function to get the leaderboard
  const { data: leaderboard, error } = await supabase
    .rpc('get_leaderboard')

  if (error) {
    console.error('Error fetching leaderboard:', error)
  }

  // Fetch all groups for the filter dropdown
  const { data: groups } = await supabase
    .from('groups')
    .select('id, name, type')
    .order('name')

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Junior Leaderboard</h1>
        <p className="mt-4 text-lg text-gray-600">Top performers in the PR committee based on successfully logged registrations.</p>
      </div>

      <LeaderboardView data={leaderboard || []} groups={groups || []} currentRole={profile?.role || 'junior'} />
    </div>
  )
}
