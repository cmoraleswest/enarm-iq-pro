import { NextResponse } from 'next/server'
import { getSession, createSessionCookie } from '@/lib/session'
import { getUserProfile } from '@/lib/firestore'
import { rateLimit } from '@/lib/rate-limit'

const SESSION_COOKIE = 'enarm_sess'
const SESSION_MAX_AGE = 30 * 24 * 60 * 60

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'
  if (!await rateLimit(`checksess:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes.' }, { status: 429 })
  }

  const session = await getSession()

  if (!session) {
    return NextResponse.json({ status: 'NO_COOKIE' })
  }

  const profile = await getUserProfile(session.uid)
  const isPaid = profile?.isPaid ?? false

  const profileData = profile as Record<string, unknown> | null
  const response = NextResponse.json({
    status: 'OK',
    uid: session.uid,
    email: session.email,
    isPaid,
    plan: profileData?.plan ?? null,
    refCode: profileData?.refCode ?? session.uid.slice(0, 8).toUpperCase(),
    totalReferrals: profileData?.totalReferrals ?? 0,
    referralBalance: profileData?.referralBalance ?? 0,
  })

  if (isPaid !== session.isPaid) {
    const cookieValue = createSessionCookie({
      uid: session.uid,
      email: session.email,
      isPaid,
    })
    response.cookies.set(SESSION_COOKIE, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    })
  }

  return response
}
