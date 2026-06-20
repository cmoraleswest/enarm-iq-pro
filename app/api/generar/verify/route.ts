import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { loadBanco } from '@/lib/exam-utils'

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { questionId, selected } = await request.json() as {
      questionId: number
      selected: string
    }

    if (!questionId || !selected) {
      return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 })
    }

    const banco = loadBanco()
    const q = banco.find(p => p.id === questionId)

    if (!q) {
      return NextResponse.json({ error: 'Pregunta no encontrada.' }, { status: 404 })
    }

    return NextResponse.json({
      isCorrect:     selected === q.respuesta_correcta,
      correcta:      q.respuesta_correcta,
      justificacion: q.justificacion,
    })
  } catch (err) {
    console.error('Error en /api/generar/verify:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
