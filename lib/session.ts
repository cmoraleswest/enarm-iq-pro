import { createHmac } from 'crypto'
import { cookies } from 'next/headers'

const SESSION_COOKIE = 'enarm_sess'
const SECRET = process.env.SESSION_SECRET || process.env.FIREBASE_ADMIN_PRIVATE_KEY || 'enarm-iq-session-secret-change-me'

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
  const parts = cookie.split('.')
  if (parts.length !== 2) return null
  const [payload, sig] = parts
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
  return decodeSession(cookie.value)
}
