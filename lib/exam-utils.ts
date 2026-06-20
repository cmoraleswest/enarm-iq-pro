import fs from 'fs'
import path from 'path'
import type { QuestionFull, QuestionForClient, Specialty, AnswerResult, ClientAnswer } from '@/types/exam'

// CIFRHS 2025: 280 reactivos (250 español + 30 inglés), 5 horas, 4 opciones
export const CIFRHS = {
  totalReactivos:    280,
  reactivosEspanol:  250,
  reactivosIngles:   30,
  tiempoLimiteSecs:  5 * 60 * 60, // 5 horas = 300 minutos
  opcionesPorReactivo: 4,
  aspirantesAnuales: 45_000,
  plazasDisponibles: 18_515,
} as const

export const EXAM_CONFIG = {
  diagnostico: {
    totalQuestions: 180,
    perSpecialty:   36,
    timeLimitSecs:  null,
    showJustifImmediately: false,
  },
  diario: {
    totalQuestions: 10,
    perSpecialty:   null,
    timeLimitSecs:  null,
    showJustifImmediately: true,
  },
  personalizado: {
    totalQuestions: null,
    perSpecialty:   null,
    timeLimitSecs:  null,
    showJustifImmediately: false,
  },
  simulador_cronometrado: {
    totalQuestions: 280,
    perSpecialty:   56, // 280 / 5 especialidades
    timeLimitSecs:  CIFRHS.tiempoLimiteSecs,
    showJustifImmediately: false,
  },
  simulador_libre: {
    totalQuestions: 280,
    perSpecialty:   56,
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

  _banco = data.map(q => {
    // CIFRHS: máximo 4 opciones (A, B, C, D)
    const incorrectas = q.respuestas_incorrectas.slice(0, CIFRHS.opcionesPorReactivo - 1)
    return {
      id: q.id,
      caso: q.caso,
      opciones: shuffle([q.respuesta_correcta, ...incorrectas]),
      respuesta_correcta: q.respuesta_correcta,
      justificacion: q.justificacion,
      categoria: q.categoria as Specialty,
      dificultad: q.dificultad,
    }
  })

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

// CIFRHS: 280 reactivos distribuidos por especialidad (56 por especialidad)
export function selectSimulatorQuestions(): QuestionFull[] {
  const banco = loadBanco()
  const specialties: Specialty[] = ['Medicina Interna', 'Pediatría', 'Ginecología', 'Cirugía', 'Urgencias']
  const perSpecialty = CIFRHS.totalReactivos / specialties.length // 56
  const selected: QuestionFull[] = []

  for (const sp of specialties) {
    const pool = banco.filter(q => q.categoria === sp)
    selected.push(...shuffle(pool).slice(0, perSpecialty))
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
