import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Wait briefly for DB trigger to create user row
        await new Promise(r => setTimeout(r, 1000))
        
        const { data: profile } = await supabase
          .from('users')
          .select('trial_claimed, plan')
          .eq('id', user.id)
          .single()

        if (!profile || (!profile.trial_claimed && profile.plan === 'trial')) {
          return NextResponse.redirect(`${origin}/claim`)
        }
      }
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth_failed`)
}
