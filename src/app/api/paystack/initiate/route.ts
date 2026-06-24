import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SUBSCRIPTION_PRICE_KOBO } from '@/lib/constants'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: 'Payment is not configured yet. Try again shortly.' }, { status: 503 })
    }

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: SUBSCRIPTION_PRICE_KOBO,
        metadata: { user_id: user.id },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://ajsuite.vercel.app'}/settings?paid=1`,
      }),
    })

    const data = await res.json()
    if (!data.status) throw new Error(data.message ?? 'Could not start checkout')

    const supabaseAdmin = supabase
    await supabaseAdmin.from('subscriptions').insert({
      owner_id: user.id,
      paystack_reference: data.data.reference,
      status: 'pending',
    })

    return NextResponse.json({ authorization_url: data.data.authorization_url })
  } catch (err: any) {
    console.error('Paystack initiate error:', err)
    return NextResponse.json({ error: err.message ?? 'Could not start checkout' }, { status: 500 })
  }
}
