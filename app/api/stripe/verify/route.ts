import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getStripe } from '@/lib/stripe'
import { adminFirestore } from '@/lib/firebase-admin'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!await rateLimit(`stripe-verify:${session.uid}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes.' }, { status: 429 })
  }

  const { sessionId } = await request.json() as { sessionId: string }
  if (!sessionId) {
    return NextResponse.json({ error: 'Falta session_id' }, { status: 400 })
  }

  try {
    const checkout = await getStripe().checkout.sessions.retrieve(sessionId)

    if (checkout.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Pago no completado' }, { status: 400 })
    }

    const uid = checkout.metadata?.uid
    if (!uid || uid !== session.uid) {
      return NextResponse.json({ error: 'Sesión no coincide' }, { status: 403 })
    }

    await adminFirestore.collection('users').doc(uid).update({
      isPaid: true,
      paidAt: Date.now(),
      plan: checkout.metadata?.plan || 'annual',
      stripeCustomerId: checkout.customer as string ?? null,
    })

    // Programa de referidos — solo plan anual
    const plan = checkout.metadata?.plan || 'annual'
    const paidUser = await adminFirestore.collection('users').doc(uid).get()
    const referredBy = paidUser.data()?.referredBy as string | undefined
    const ownRefCode = paidUser.data()?.refCode as string | undefined
    if (plan === 'annual' && referredBy && !paidUser.data()?.referralProcessed && referredBy !== ownRefCode) {
      const refSnap = await adminFirestore.collection('users')
        .where('refCode', '==', referredBy).limit(1).get()
      if (!refSnap.empty && refSnap.docs[0].id !== uid) {
        const referrer = refSnap.docs[0]
        const data = referrer.data()
        await referrer.ref.update({
          totalReferrals: (data.totalReferrals || 0) + 1,
          referralBalance: (data.referralBalance || 0) + 150,
        })
        await adminFirestore.collection('referrals').add({
          referrerId: referrer.id,
          referrerEmail: data.email,
          referredId: uid,
          referredEmail: session.email,
          amount: 150,
          status: 'pending',
          createdAt: Date.now(),
        })
        await adminFirestore.collection('users').doc(uid).update({ referralProcessed: true })
      }
    }

    return NextResponse.json({ ok: true, isPaid: true })
  } catch {
    return NextResponse.json({ error: 'Error al verificar el pago.' }, { status: 500 })
  }
}
