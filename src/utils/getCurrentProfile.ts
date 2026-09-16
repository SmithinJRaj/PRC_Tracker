import { cache } from 'react'
import { createClient } from '@/utils/supabase/server'

export const getCurrentProfile = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { supabase, user: null, profile: null }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*, groups:group_id (name, type)')
    .eq('id', user.id)
    .single()

  return { supabase, user, profile }
})
