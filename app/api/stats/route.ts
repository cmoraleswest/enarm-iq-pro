import { NextResponse } from 'next/server'
import { getUserStats } from '@/lib/firestore'
import { getSessionFromCookie } from '@/lib/session'

export async function GET() {
  const session = await getSessionFromCookie()

  if (!session?.uid) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }

  try {
    const stats = await getUserStats(session.uid)
    return NextResponse.json({ stats })
  } catch {
    return NextResponse.json({ error: 'Error al obtener estadísticas.' }, { status: 500 })
  }
}
