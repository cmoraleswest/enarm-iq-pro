import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const SESSION_COOKIE = 'enarm_sess'

export async function GET() {
  const store = await cookies()
  const sess = store.get(SESSION_COOKIE)

  if (!sess?.value) {
    return NextResponse.json({ status: 'NO_COOKIE', cookies: store.getAll().map(c => c.name) })
  }

  try {
    const decoded = JSON.parse(Buffer.from(sess.value, 'base64').toString())
    return NextResponse.json({
      status: 'OK',
      uid: decoded.uid,
      email: decoded.email,
    })
  } catch {
    return NextResponse.json({ status: 'INVALID' })
  }
}
