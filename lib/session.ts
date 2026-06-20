import { cookies } from 'next/headers'
import { createHmac } from 'crypto'

export interface SessionPayload {
  uid: string
  email: string
  isPaid: boolean
}

const COOKIE_NAME = 'enarm_sess'

function getSecret(): string {
  const s = process.env.SESSION_SECRET
  if (!s) throw new Error('SESSION_SECRET no definida')
  return s
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex')
}

export function createSessionCookie(data: SessionPayload): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64')
  const sig = sign(payload)
  return `${payload}.${sig}`
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  if (!raw) return null

  const dotIdx = raw.lastIndexOf('.')
  if (dotIdx === -1) return null

  const payload = raw.slice(0, dotIdx)
  const sig = raw.slice(dotIdx + 1)

  // Verificar firma HMAC
  const expected = sign(payload)
  if (sig.length !== expected.length) return null

  // Comparación en tiempo constante
  let mismatch = 0
  for (let i = 0; i < sig.length; i++) {
    mismatch |= sig.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  if (mismatch !== 0) return null

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64').toString()) as SessionPayload
    if (!data.uid) return null
    return data
  } catch {
    return null
  }
}
