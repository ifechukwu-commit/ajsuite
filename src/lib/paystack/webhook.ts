import crypto from 'crypto'
import { SUBSCRIPTION_PRICE_KOBO } from '@/lib/constants'

export function verifyPaystackSignature(payload: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(payload)
    .digest('hex')
  return hash === signature
}

export function isValidSubscriptionAmount(amount: number): boolean {
  return amount === SUBSCRIPTION_PRICE_KOBO
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
