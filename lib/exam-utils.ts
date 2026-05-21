import fs from 'fs'
import path from 'path'
import type { QuestionFull, QuestionForClient, Specialty, AnswerResult, ClientAnswer } from '@/types/exam'

// Parámetros de cada tipo de examen
export const EXAM_CONFIG = {
  diagnostico: {
    totalQuestions: 180,
    perSpecialty:   36,
    timeLimitSecs:  null,  // sin límite
    showJustifImmediately: false,
  },
  diario: {
    totalQuestions: 10,
    perSpecialty:   null,  // aleatorio mezclado
    timeLimitSecs:  null,
    showJustifImmediately: true,
  },
  personalizado: {
    totalQuestions: null,  // el usuario elige 10-40
    perSpecialty:   null,
    timeLimitSecs:  null,
    showJustifImmediately: false,
  },
  simulador_cronometrado: {
    totalQuestions: 360,
    perSpecialty:   72,
    timeLimitSecs:  6 * 60 * 60, // 6 horas
    showJustifImmediately: false,
  },
  simulador_libre: {
    totalQuestions: 360,
    perSpecialty:   72,
    timeLimitSecs:  null,
    showJustifImmediately: false,
  },
} as const

const BANCO_PATH = path.join(process.cwd(), 'data', 'banco_preguntas.json')

let _banco: QuestionFull[] | null = null

export function loadBanco(): QuestionFull[] {
  if (_banco) return _banco
  const raw = fs.readFileSync(BANCO_PATH, 'utf-8')
  const data = JSON.parse(raw) as Array<{
    id: number
    caso: string
    respuesta_correcta: string
    respuestas_incorrectas: string[]
    justificacion: string
    categoria: string
    dificultad: string
  }>

  _banco = data.map(q => ({
    id: q.id,
    caso: q.caso,
    opciones: shuffle([q.respuesta_correcta, ...q.respuestas_incorrectas]),
    respuesta_correcta: q.respuesta_correcta,
    justificacion: q.justificacion,
    categoria: q.categoria as Specialty,
    dificultad: q.dificultad,
  }))

  return _banco
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Selecciona preguntas para un diagnóstico (36 por especialidad)
export function selectDiagnosticQuestions(): QuestionFull[] {
  const banco = loadBanco()
  const specialties: Specialty[] = ['Medicina Interna', 'Pediatría', 'Ginecología', 'Cirugía', 'Urgencias']
  const selected: QuestionFull[] = []

  for (const sp of specialties) {
    const pool = banco.filter(q => q.categoria === sp)
    selected.push(...shuffle(pool).slice(0, 36))
  }

  return shuffle(selected)
}

// Selecciona preguntas mezcladas (para diario y simulador)
export function selectMixedQuestions(
  total: number,
  specialties?: Specialty[],
): QuestionFull[] {
  const banco = loadBanco()
  const pool = specialties?.length
    ? banco.filter(q => specialties.includes(q.categoria))
    : banco
  return shuffle(pool).slice(0, total)
}

// Selecciona preguntas para simulador real (72 por especialidad)
export function selectSimulatorQuestions(): QuestionFull[] {
  const banco = loadBanco()
  const specialties: Specialty[] = ['Medicina Interna', 'Pediatría', 'Ginecología', 'Cirugía', 'Urgencias']
  const selected: QuestionFull[] = []

  for (const sp of specialties) {
    const pool = banco.filter(q => q.categoria === sp)
    selected.push(...shuffle(pool).slice(0, 72))
  }

  return shuffle(selected)
}

// Quita la respuesta correcta para enviar al cliente
export function toClientQuestion(q: QuestionFull): QuestionForClient {
  return {
    id: q.id,
    caso: q.caso,
    opciones: q.opciones,
    categoria: q.categoria,
    dificultad: q.dificultad,
  }
}

// Califica las respuestas del cliente contra el banco
export function gradeAnswers(
  clientAnswers: ClientAnswer[],
  fullQuestions: QuestionFull[],
): AnswerResult[] {
  const qMap = new Map(fullQuestions.map(q => [q.id, q]))

  return clientAnswers.map(ca => {
    const q = qMap.get(ca.questionId)
    if (!q) throw new Error(`Pregunta ${ca.questionId} no encontrada`)
    return {
      questionId: ca.questionId,
      caso: q.caso,
      selected: ca.selected,
      correcta: q.respuesta_correcta,
      isCorrect: ca.selected === q.respuesta_correcta,
      justificacion: q.justificacion,
      categoria: q.categoria,
      dificultad: q.dificultad,
    }
  })
}
