import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { adminFirestore } from '@/lib/firebase-admin'
import type Stripe from 'stripe'

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Sin firma' }, { status: 400 })
  }

  const body = await request.text()

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err) {
    console.error('Webhook firma inválida:', err)
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const uid = session.metadata?.uid

    if (!uid) {
      console.error('Webhook: falta uid en metadata')
      return NextResponse.json({ error: 'Metadata incompleta' }, { status: 400 })
    }

    let promoCode: string | null = null
    let influencerId: string | null = null

    if (session.discounts?.length) {
      const disc = session.discounts[0]
      const coupon = disc.coupon
      if (coupon && typeof coupon === 'object') {
        promoCode = coupon.name ?? coupon.id
      } else if (typeof coupon === 'string') {
        promoCode = coupon
      }

      if (promoCode) {
        const snap = await adminFirestore
          .collection('influencers')
          .where('promoCode', '==', promoCode.toUpperCase())
          .limit(1)
          .get()

        if (!snap.empty) {
          influencerId = snap.docs[0].id
          // Actualizar stats del influencer
          const influencerData = snap.docs[0].data()
          await snap.docs[0].ref.update({
            totalReferrals: (influencerData.totalReferrals || 0) + 1,
            totalRevenue: (influencerData.totalRevenue || 0) + (session.amount_total || 0) / 100,
          })
        }
      }
    }

    const updateData: Record<string, unknown> = {
      isPaid: true,
      paidAt: Date.now(),
      plan: session.metadata?.plan || 'monthly',
      stripeCustomerId: session.customer as string ?? null,
    }
    if (promoCode) updateData.promoCode = promoCode
    if (influencerId) updateData.influencerId = influencerId

    await adminFirestore.collection('users').doc(uid).update(updateData)
    console.log(`Pago exitoso: uid=${uid}, promo=${promoCode}, influencer=${influencerId}`)
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const snap = await adminFirestore.collection('users')
      .where('stripeCustomerId', '==', sub.customer).limit(1).get()
    if (!snap.empty) {
      await snap.docs[0].ref.update({ isPaid: false, plan: null })
      console.log(`Suscripción cancelada: ${snap.docs[0].id}`)
    }
  }

  // Reembolso — revocar acceso
  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge
    const customerId = charge.customer as string
    if (customerId) {
      const snap = await adminFirestore.collection('users')
        .where('stripeCustomerId', '==', customerId).limit(1).get()
      if (!snap.empty) {
        await snap.docs[0].ref.update({ isPaid: false, plan: null, refundedAt: Date.now() })
        console.log(`Reembolso procesado: ${snap.docs[0].id}`)
      }
    }
  }

  // Pago fallido — marcar para notificar
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const customerId = invoice.customer as string
    if (customerId) {
      const snap = await adminFirestore.collection('users')
        .where('stripeCustomerId', '==', customerId).limit(1).get()
      if (!snap.empty) {
        await snap.docs[0].ref.update({
          paymentFailedAt: Date.now(),
          paymentFailedCount: (snap.docs[0].data().paymentFailedCount || 0) + 1,
        })
        console.log(`Pago fallido: ${snap.docs[0].id}`)
      }
    }
  }

  return NextResponse.json({ received: true })
}
