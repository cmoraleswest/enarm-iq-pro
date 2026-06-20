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

    // Extraer código de promoción si existe
    let promoCode: string | null = null
    let influencerId: string | null = null

    if (session.discounts?.length) {
      const disc = session.discounts[0]
      // coupon puede ser string (ID) u objeto expandido
      const coupon = disc.coupon
      if (coupon && typeof coupon === 'object') {
        promoCode = coupon.name ?? coupon.id
      } else if (typeof coupon === 'string') {
        promoCode = coupon
      }

      // Buscar influencer por código de promoción
      if (promoCode) {
        const snap = await adminFirestore
          .collection('influencers')
          .where('promoCode', '==', promoCode.toUpperCase())
          .limit(1)
          .get()

        if (!snap.empty) {
          influencerId = snap.docs[0].id
        }
      }
    }

    // Actualizar usuario como pagado
    const updateData: Record<string, unknown> = {
      isPaid: true,
      paidAt: Date.now(),
      stripeCustomerId: session.customer as string ?? null,
    }
    if (promoCode) updateData.promoCode = promoCode
    if (influencerId) updateData.influencerId = influencerId

    await adminFirestore.collection('users').doc(uid).update(updateData)

    console.log(`Pago exitoso: uid=${uid}, promo=${promoCode}, influencer=${influencerId}`)
  }

  return NextResponse.json({ received: true })
}
