import { NextResponse } from 'next/server'
import { getUserStats } from '@/lib/firestore'
import { getSessionFromCookie } from '@/lib/session'

export async function GET() {
  const session = await getSessionFromCookie()

  if (!session?.uid) {
    return NextResponse.json({ error: 'No autenticado.', debug: 'no_session' }, { status: 401 })
  }

  try {
    const stats = await getUserStats(session.uid)
    return NextResponse.json({ stats })
  } catch (err) {
    console.error('Stats error for uid:', session.uid, err)
    return NextResponse.json({ error: 'Error al obtener estadísticas.', debug: 'firestore_error' }, { status: 500 })
  }
}
