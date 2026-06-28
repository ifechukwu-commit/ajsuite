import { createClient, createServiceClient } from '@/lib/supabase/server'
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
        // Explicit override for flows like joining a matter's secure
        // session link — skip every other redirect rule entirely.
        const next = searchParams.get('next')
        if (next) {
          return NextResponse.redirect(`${origin}${next}`)
        }

        // Wait briefly for DB trigger to create user row
        await new Promise(r => setTimeout(r, 1000))

        const serviceClient = createServiceClient()
        serviceClient.from('login_logs').insert({ user_id: user.id, email: user.email }).then(() => {})

        const { data: profile } = await supabase
          .from('users')
          .select('trial_claimed, plan, owner_id')
          .eq('id', user.id)
          .single()

        // Anyone with an owner_id never goes through trial/claim
        // onboarding — that only applies to new independent owners.
        if (profile?.owner_id) {
          return NextResponse.redirect(`${origin}/dashboard`)
        }

        if (profile?.plan === 'admin') {
          return NextResponse.redirect(`${origin}/admin`)
        }

        if (!profile || (!profile.trial_claimed && profile.plan === 'trial')) {
          return NextResponse.redirect(`${origin}/claim`)
        }
      }
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth_failed`)
}
