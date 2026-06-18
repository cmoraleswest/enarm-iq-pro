import Stripe from 'stripe'

export const PLANS = {
  monthly: {
    priceId: 'price_1TjYGuFqy3VFvYx2KBZQD6L5',
    amount: 99,
    label: 'Mensual',
    interval: 'month',
  },
  annual: {
    priceId: 'price_1TjYJAFqy3VFvYx2axaf7vuv',
    amount: 599,
    label: 'Anual',
    interval: 'year',
  },
} as const

export const REFERRAL_CREDIT = 150

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY no definida')
  return new Stripe(key, {
    apiVersion: '2026-05-27.dahlia',
  })
}
