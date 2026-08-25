import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      const user = data.user
      const email = user.email

      if (email && email.endsWith('@nitc.ac.in')) {
        // Check if user exists in public.users
        const { data: profile } = await supabase
          .from('users')
          .select('id, role')
          .eq('id', user.id)
          .single()

        if (!profile) {
          // New user, determine role based on email
          let role = 'junior'
          if (email.includes('_b24') || email.includes('_b25')) {
            role = 'senior'
          } else if (email.includes('_b26')) {
            role = 'junior'
          }

          const fullName = user.user_metadata?.full_name || email.split('@')[0]

          // Insert into public.users
          await supabase.from('users').insert({
            id: user.id,
            email: email,
            role: role,
            full_name: fullName
          })
          
          return NextResponse.redirect(`${origin}/dashboard/register`)
        } else {
          // Existing user, redirect to their dashboard based on role
          return NextResponse.redirect(`${origin}/dashboard/register`)
        }
      } else {
        // If they bypass domain check, delete their auth session and redirect
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/unauthorized`)
      }
    }
  }

  // URL to redirect to after sign in process completes or fails
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
