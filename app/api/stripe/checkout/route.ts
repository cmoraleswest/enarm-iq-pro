import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getStripe } from '@/lib/stripe'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { plan } = await request.json() as { plan: 'annual' | 'monthly' }

    const priceId = plan === 'annual'
      ? process.env.STRIPE_PRICE_ANNUAL
      : process.env.STRIPE_PRICE_MONTHLY

    if (!priceId) {
      return NextResponse.json({ error: 'Plan no configurado.' }, { status: 500 })
    }

    const origin = request.headers.get('origin') ?? 'https://simulaenarm.com'

    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        uid: session.uid,
        email: session.email,
        plan,
      },
      success_url: `${origin}/pago/exitoso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/upgrade`,
      locale: 'es',
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err) {
    console.error('Error Stripe checkout:', err)
    return NextResponse.json({ error: 'Error al crear sesión de pago.' }, { status: 500 })
  }
}
