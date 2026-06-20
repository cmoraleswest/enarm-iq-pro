import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { loadBanco, shuffle } from '@/lib/exam-utils'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!rateLimit(`generar:${session.uid}`, 60, 60_000)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta en 1 minuto.' }, { status: 429 })
  }

  try {
    const body = await request.json() as { categoria?: string }
    const banco = loadBanco()

    const pool = body.categoria
      ? banco.filter(q => q.categoria === body.categoria)
      : banco

    if (!pool.length) {
      return NextResponse.json({ error: 'No hay preguntas disponibles para esa categoría.' }, { status: 404 })
    }

    const q = shuffle(pool)[0]

    return NextResponse.json({
      id:         q.id,
      caso:       q.caso,
      opciones:   q.opciones,
      categoria:  q.categoria,
      dificultad: q.dificultad,
    })
  } catch (err) {
    console.error('Error en /api/generar:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
