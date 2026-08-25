'use server'

import { revalidatePath } from 'next/cache'

export async function revalidateDashboard() {
  revalidatePath('/dashboard/master')
  revalidatePath('/dashboard/leads')
  revalidatePath('/dashboard/register')
  revalidatePath('/dashboard/leaderboard')
}
