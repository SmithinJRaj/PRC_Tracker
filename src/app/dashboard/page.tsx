import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/utils/getCurrentProfile'

export default async function DashboardRoot() {
  const { user, profile } = await getCurrentProfile()

  if (!user || !profile) {
    redirect('/login')
  }

  if (profile.role === 'admin') {
    redirect('/dashboard/management')
  } else {
    redirect('/dashboard/attendance')
  }
}
