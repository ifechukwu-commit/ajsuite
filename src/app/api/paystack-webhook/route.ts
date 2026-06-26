import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyPaystackSignature, isValidSubscriptionAmount, type PaystackEvent } from '@/lib/paystack/webhook'

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
    const amount = event.data?.amount
    if (!email || !reference) return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    if (!isValidSubscriptionAmount(amount)) return NextResponse.json({ error: 'Unexpected amount' }, { status: 400 })

    const supabase = createServiceClient()

    // Idempotency — if this reference was already marked success, don't extend twice.
    const { data: existingSub } = await supabase
      .from('subscriptions').select('id, status').eq('paystack_reference', reference).single()
    if (existingSub?.status === 'success') return NextResponse.json({ received: true })

    const { data: existing } = await supabase
      .from('users').select('id, plan, paid_until, workspace_type').eq('email', email).single()
    if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const base = existing.paid_until && new Date(existing.paid_until) > new Date()
      ? new Date(existing.paid_until)
      : new Date()
    const newPaidUntil = new Date(base.getTime() + 30 * 86400000)

    const newPlan = (existing.plan === 'solo' || existing.plan === 'chamber')
      ? existing.plan
      : (existing.workspace_type === 'chamber' ? 'chamber' : 'solo')

    await supabase.from('users').update({ plan: newPlan, paid_until: newPaidUntil.toISOString() }).eq('id', existing.id)

    await supabase.from('subscriptions')
      .update({ status: 'success', paid_at: new Date().toISOString(), expires_at: newPaidUntil.toISOString() })
      .eq('paystack_reference', reference)

    await supabase.from('notifications').insert({
      user_id: existing.id,
      title: 'Subscription Activated',
      body: `Your AJ Suite subscription is active until ${newPaidUntil.toLocaleDateString('en-GB')}. Thank you.`,
      type: 'paystack',
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: err.message ?? 'Webhook failed' }, { status: 500 })
  }
}
