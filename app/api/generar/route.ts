import { NextResponse } from 'next/server'
import { loadBanco, shuffle } from '@/lib/exam-utils'

export async function POST(request: Request) {
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
      id:                 q.id,
      caso:               q.caso,
      opciones:           q.opciones,
      respuesta_correcta: q.respuesta_correcta,
      justificacion:      q.justificacion,
      categoria:          q.categoria,
      dificultad:         q.dificultad,
    })
  } catch (err) {
    console.error('Error en /api/generar:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
