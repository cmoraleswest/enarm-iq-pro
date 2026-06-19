import { NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/session'

export async function GET() {
  const session = await getSessionFromCookie()

  if (!session) {
    return NextResponse.json({ status: 'NO_COOKIE' })
  }

  return NextResponse.json({
    status: 'OK',
    uid: session.uid,
    email: session.email,
  })
}
