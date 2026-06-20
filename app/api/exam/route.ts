import { NextResponse } from 'next/server'
import {
  loadBanco, selectDiagnosticQuestions, selectMixedQuestions,
  selectSimulatorQuestions, toClientQuestion, gradeAnswers, EXAM_CONFIG,
} from '@/lib/exam-utils'
import {
  gradeAndSave,
  storePendingSession,
  fetchPendingSession,
  removePendingSession,
  getExamSession,
} from '@/lib/firestore'
import { getSession } from '@/lib/session'
import { rateLimit } from '@/lib/rate-limit'
import type {
  ExamType, Specialty, ClientAnswer, StartExamResponse, SubmitExamResponse,
} from '@/types/exam'

// POST /api/exam — iniciar o calificar examen
export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!rateLimit(`exam:${session.uid}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta en 1 minuto.' }, { status: 429 })
  }
  const uid = session.uid

  const body = await request.json() as {
    action: 'start' | 'submit'
    // Para start:
    examType?: ExamType
    specialties?: Specialty[]
    numQuestions?: number
    // Para submit:
    sessionId?: string
    answers?: ClientAnswer[]
    startedAt?: number
    partial?: boolean  // true = calificar sin borrar sesión (usado en diario)
  }

  try {
    if (body.action === 'start') {
      return await handleStart(uid, body.examType!, body.specialties, body.numQuestions)
    }

    if (body.action === 'submit') {
      return await handleSubmit(uid, body.sessionId!, body.answers!, body.startedAt!, body.partial ?? false)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[api/exam] error:', msg)
    return NextResponse.json({ error: 'Error interno', detail: msg }, { status: 500 })
  }

  return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
}

async function handleStart(
  uid: string,
  examType: ExamType,
  specialties?: Specialty[],
  numQuestions?: number,
): Promise<NextResponse<StartExamResponse | { error: string }>> {
  let questions: ReturnType<typeof loadBanco>

  switch (examType) {
    case 'diagnostico':
      questions = selectDiagnosticQuestions()
      break
    case 'diario':
      questions = selectMixedQuestions(10)
      break
    case 'personalizado': {
      const n = Math.min(40, Math.max(10, numQuestions ?? 20))
      questions = selectMixedQuestions(n, specialties)
      break
    }
    case 'simulador_cronometrado':
    case 'simulador_libre':
      questions = selectSimulatorQuestions()
      break
    default:
      return NextResponse.json({ error: 'Tipo de examen no válido' }, { status: 400 })
  }

  const sessionId      = `${uid}_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const config         = EXAM_CONFIG[examType]
  const usedSpecialties = specialties ?? ['Medicina Interna', 'Pediatría', 'Ginecología', 'Cirugía', 'Urgencias']
  const startedAt      = Date.now()

  // Guardar solo IDs en Firestore (serverless-safe, no Map en memoria)
  await storePendingSession(
    sessionId,
    questions.map(q => q.id),
    examType,
    usedSpecialties,
    startedAt,
  )

  return NextResponse.json({
    sessionId,
    questions:        questions.map(toClientQuestion),
    examType,
    timeLimitSeconds: ('timeLimitSecs' in config ? config.timeLimitSecs : null) as number | null,
  })
}

async function handleSubmit(
  uid: string,
  sessionId: string,
  clientAnswers: ClientAnswer[],
  startedAt: number,
  partial: boolean,
): Promise<NextResponse<SubmitExamResponse | { answers: ReturnType<typeof gradeAnswers> } | { error: string }>> {
  // Verificar que el UID coincide
  if (!sessionId.startsWith(uid)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Leer sesión desde Firestore (persiste entre instancias serverless)
  const pending = await fetchPendingSession(sessionId)
  if (!pending) {
    return NextResponse.json({ error: 'Sesión expirada o no encontrada. Reinicia el examen.' }, { status: 404 })
  }

  // Reconstruir preguntas completas desde el banco usando los IDs guardados
  const banco = loadBanco()
  const qMap  = new Map(banco.map(q => [q.id, q]))
  const questions = pending.questionIds.map(id => qMap.get(id)).filter(Boolean) as ReturnType<typeof loadBanco>

  const answers = gradeAnswers(clientAnswers, questions)

  // Calificación parcial: devuelve resultados sin guardar en Firestore ni borrar sesión
  if (partial) {
    return NextResponse.json({ answers })
  }

  const result = await gradeAndSave(
    uid,
    pending.examType as ExamType,
    answers,
    startedAt,
    pending.specialties as Specialty[],
  )

  await removePendingSession(sessionId)

  return NextResponse.json(result)
}
