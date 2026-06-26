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
        // Wait briefly for DB trigger to create user row
        await new Promise(r => setTimeout(r, 1000))

        const serviceClient = createServiceClient()
        serviceClient.from('login_logs').insert({ user_id: user.id, email: user.email }).then(() => {})

        // Catch invites sent AFTER this person already had an account —
        // the signup trigger only runs once, so this is the fallback.
        const { data: pendingInvite } = await serviceClient
          .from('team_invites')
          .select('*')
          .eq('email', user.email)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (pendingInvite) {
  return NextResponse.redirect(`${origin}/team/invite`)
}

        const { data: profile } = await supabase
          .from('users')
          .select('trial_claimed, plan, owner_id')
          .eq('id', user.id)
          .single()

        // Anyone invited in (owner_id set) never goes through trial/claim
        // onboarding — that only applies to new independent owners.
        if (profile?.owner_id) {
          // check if user has pending invite BEFORE routing
const serviceClient = createServiceClient()

const { data: pendingInvite } = await serviceClient
  .from('team_invites')
  .select('id')
  .eq('email', user.email)
  .limit(1)
  .maybeSingle()

if (pendingInvite) {
  return NextResponse.redirect(`${origin}/team/invite`)
}

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
