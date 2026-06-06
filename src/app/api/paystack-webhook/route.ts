import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyPaystackSignature, getPlanFromPaystackEvent, type PaystackEvent } from '@/lib/paystack/webhook'

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-paystack-signature') ?? ''
    const payload = await request.text()

    if (!verifyPaystackSignature(payload, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event: PaystackEvent = JSON.parse(payload)

    if (event.event !== 'charge.success') {
      return NextResponse.json({ received: true })
    }

    const email = event.data?.customer?.email
    const reference = event.data?.reference
    if (!email || !reference) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

    const supabase = await createServiceClient()

    // Idempotency check — don't process same reference twice
    const { data: existing } = await supabase
      .from('users').select('id, plan').eq('email', email).single()

    if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const plan = getPlanFromPaystackEvent(event)
    if (!plan) return NextResponse.json({ error: 'Unknown plan amount' }, { status: 400 })

    await supabase.from('users').update({ plan }).eq('email', email)

    // Send notification to user
    await supabase.from('notifications').insert({
      user_id: existing.id,
      title: 'Subscription Activated',
      body: `Your ${plan === 'solo' ? 'Solo Counsel' : 'Chamber Pro'} plan is now active. Thank you.`,
      type: 'paystack',
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: err.message ?? 'Webhook failed' }, { status: 500 })
  }
}
