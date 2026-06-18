import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserStats } from '@/lib/firestore'

export async function GET() {
  const cookieStore = await cookies()
  const raw = cookieStore.get('enarm_sess')?.value

  if (!raw) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  }

  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64').toString()) as { uid: string }
    if (!parsed.uid) {
      return NextResponse.json({ error: 'Sesión inválida.' }, { status: 401 })
    }
    const stats = await getUserStats(parsed.uid)
    return NextResponse.json({ stats })
  } catch {
    return NextResponse.json({ error: 'Error al obtener estadísticas.' }, { status: 500 })
  }
}
