import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ status: 'NO_COOKIE' })
  }

  return NextResponse.json({
    status: 'OK',
    uid: session.uid,
    email: session.email,
  })
}
