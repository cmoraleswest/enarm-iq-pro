import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserStats } from '@/lib/firestore'

export async function GET() {
  const cookieStore = await cookies()
  const raw = cookieStore.get('enarm_sess')?.value

  try {
    const uid = raw ? (JSON.parse(Buffer.from(raw, 'base64').toString()) as { uid: string }).uid : 'anonymous'
    const stats = await getUserStats(uid)
    return NextResponse.json({ stats })
  } catch {
    return NextResponse.json({ error: 'Error al obtener estadísticas.' }, { status: 500 })
  }
}
