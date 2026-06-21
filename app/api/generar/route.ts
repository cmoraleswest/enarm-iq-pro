import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getSession } from '@/lib/session'
import { loadBanco, shuffle } from '@/lib/exam-utils'
import { rateLimit, redis } from '@/lib/rate-limit'

const ZWS = '​‌‍﻿'
function watermark(text: string, uid: string): string {
  const hash = uid.slice(0, 6)
  const bits = hash.split('').map(c => c.charCodeAt(0) % ZWS.length)
  const mark = bits.map(b => ZWS[b]).join('')
  return text.slice(0, Math.floor(text.length / 2)) + mark + text.slice(Math.floor(text.length / 2))
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!session.isPaid) {
    const { getUserProfile } = await import('@/lib/firestore')
    const profile = await getUserProfile(session.uid)
    if (!profile?.isPaid) {
      return NextResponse.json({ error: 'Suscripción requerida.' }, { status: 402 })
    }
  }

  const body = await request.json() as { action?: string; categoria?: string; questionId?: number; mode?: string }
  const action = body.action ?? 'generate'

  if (action === 'reveal') {
    if (!await rateLimit(`reveal:${session.uid}`, 20, 3600_000)) {
      return NextResponse.json({ error: 'Límite de explicaciones alcanzado. Intenta en 1 hora.' }, { status: 429 })
    }

    const qId = body.questionId
    if (!qId) return NextResponse.json({ error: 'Datos incompletos.' }, { status: 400 })

    const allowed = await redis.get(`flash:${session.uid}:${qId}`)
    if (!allowed) {
      return NextResponse.json({ error: 'Pregunta no autorizada.' }, { status: 403 })
    }

    const banco = loadBanco()
    const q = banco.find(p => p.id === qId)
    if (!q) return NextResponse.json({ error: 'No encontrada.' }, { status: 404 })

    await redis.del(`flash:${session.uid}:${qId}`)

    return NextResponse.json({
      correcta: watermark(q.respuesta_correcta, session.uid),
      justificacion: watermark(q.justificacion, session.uid),
    })
  }

  if (!await rateLimit(`generar:${session.uid}`, 60, 60_000)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes.' }, { status: 429 })
  }

  if (body.mode === 'short') {
    try {
      const flashRaw = fs.readFileSync(path.join(process.cwd(), 'data', 'flashcards_cortas.json'), 'utf-8')
      const flashcards = JSON.parse(flashRaw) as { id: number; pregunta: string; respuesta: string; categoria: string }[]
      const pool = body.categoria ? flashcards.filter(f => f.categoria === body.categoria) : flashcards
      if (!pool.length) return NextResponse.json({ error: 'No hay flashcards.' }, { status: 404 })
      const f = pool[Math.floor(Math.random() * pool.length)]
      return NextResponse.json({ id: f.id, pregunta: f.pregunta, respuesta: f.respuesta, categoria: f.categoria, mode: 'short' })
    } catch {
      return NextResponse.json({ error: 'Error al cargar flashcards.' }, { status: 500 })
    }
  }

  try {
    const banco = loadBanco()
    const pool = body.categoria ? banco.filter(q => q.categoria === body.categoria) : banco

    if (!pool.length) {
      return NextResponse.json({ error: 'No hay preguntas disponibles.' }, { status: 404 })
    }

    const q = shuffle(pool)[0]

    await redis.set(`flash:${session.uid}:${q.id}`, '1', { ex: 300 })

    return NextResponse.json({
      id: q.id,
      caso: q.caso,
      opciones: q.opciones,
      categoria: q.categoria,
      dificultad: q.dificultad,
    })
  } catch {
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 })
  }
}
