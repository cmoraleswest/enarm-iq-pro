import { createHmac } from 'crypto'
import { cookies } from 'next/headers'

const SESSION_COOKIE = 'enarm_sess'
const SECRET = process.env.SESSION_SECRET || 'enarm-iq-hmac-secret-2026'

interface SessionData {
  uid: string
  email: string
  isPaid: boolean
  daysLeft: number
  trialActive: boolean
}

function sign(data: string): string {
  return createHmac('sha256', SECRET).update(data).digest('hex')
}

export function encodeSession(data: SessionData): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64')
  const sig = sign(payload)
  return `${payload}.${sig}`
}

export function decodeSession(cookie: string): SessionData | null {
  const lastDot = cookie.lastIndexOf('.')
  if (lastDot === -1) return null
  const payload = cookie.substring(0, lastDot)
  const sig = cookie.substring(lastDot + 1)
  if (sign(payload) !== sig) return null
  try {
    return JSON.parse(Buffer.from(payload, 'base64').toString()) as SessionData
  } catch {
    return null
  }
}

export async function getSessionFromCookie(): Promise<SessionData | null> {
  const store = await cookies()
  const cookie = store.get(SESSION_COOKIE)
  if (!cookie?.value) return null
  const signed = decodeSession(cookie.value)
  if (signed) return signed
  // Fallback: try legacy unsigned base64 cookie (for existing sessions)
  try {
    const data = JSON.parse(Buffer.from(cookie.value, 'base64').toString()) as SessionData
    if (data.uid) return data
  } catch { /* not valid legacy cookie */ }
  return null
}
