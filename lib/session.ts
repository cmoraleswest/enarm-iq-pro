import { cookies } from 'next/headers'

export interface SessionPayload {
  uid: string
  email: string
  isPaid: boolean
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get('enarm_sess')?.value
  if (!raw) return null
  try {
    const data = JSON.parse(Buffer.from(raw, 'base64').toString()) as SessionPayload
    if (!data.uid) return null
    return data
  } catch {
    return null
  }
}
