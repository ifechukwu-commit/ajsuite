import crypto from 'crypto'

// ============================================
// PRICING — fill in when ready
// Amounts are in Kobo: ₦1,000 = 100000 kobo
// ============================================
export const PLANS = {
  solo: {
    name: 'Solo Counsel',
    price: 0, // INSERT_SOLO_PRICE_HERE — e.g. 1500000 for ₦15,000/month
    plan_key: 'solo' as const,
  },
  chamber: {
    name: 'Chamber Pro',
    price: 0, // INSERT_CHAMBER_PRICE_HERE — e.g. 7500000 for ₦75,000/month
    plan_key: 'chamber' as const,
  },
}

export function verifyPaystackSignature(payload: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(payload)
    .digest('hex')
  return hash === signature
}

export function getPlanFromPaystackEvent(event: PaystackEvent): 'solo' | 'chamber' | null {
  const amount = event.data?.amount
  if (PLANS.solo.price > 0 && amount === PLANS.solo.price) return 'solo'
  if (PLANS.chamber.price > 0 && amount === PLANS.chamber.price) return 'chamber'
  return null
}

export interface PaystackEvent {
  event: string
  data: {
    id: number
    reference: string
    amount: number
    status: string
    customer: { email: string }
    metadata?: { user_id?: string }
  }
}
