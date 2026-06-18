import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { adminFirestore } from '@/lib/firebase-admin'
import { creditReferrerIfExists } from '@/lib/referrals'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  let event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 400 })
  }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    const uid = session.metadata?.uid
    if (uid) {
      await adminFirestore.collection('users').doc(uid).update({
        isPaid: true,
        paidAt: Date.now(),
        plan: session.metadata?.plan || 'monthly',
        stripeCustomerId: session.customer,
        stripeSessionId: session.id,
      })
      await creditReferrerIfExists(uid)
    }
  }
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as any
    const snap = await adminFirestore.collection('users')
      .where('stripeCustomerId', '==', sub.customer).limit(1).get()
    if (!snap.empty) {
      await snap.docs[0].ref.update({ isPaid: false, plan: null })
    }
  }
  return NextResponse.json({ ok: true })
}
