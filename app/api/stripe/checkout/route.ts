import { NextRequest, NextResponse } from 'next/server'
import { stripe, PLANS } from '@/lib/stripe'
import { getUserProfile } from '@/lib/firestore'
import { getCreditBalance } from '@/lib/referrals'
import { getServerSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json()
    const session = await getServerSession(req)
    if (!session?.uid) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    const profile = await getUserProfile(session.uid)
    if (!profile) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    const selectedPlan = PLANS[plan as keyof typeof PLANS]
    if (!selectedPlan) return NextResponse.json({ error: 'Plan inválido' }, { status: 400 })
    const creditBalance = await getCreditBalance(session.uid)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://enarm-iq.vercel.app'
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: selectedPlan.priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${appUrl}/pago/exitoso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/upgrade`,
      customer_email: profile.email,
      metadata: { uid: session.uid, plan, creditBalance: creditBalance.toString() },
      locale: 'es',
    })
    return NextResponse.json({ url: checkoutSession.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Error al crear sesión de pago' }, { status: 500 })
  }
}
