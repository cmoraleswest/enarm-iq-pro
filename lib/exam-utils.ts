import fs from 'fs'
import path from 'path'
import type { QuestionFull, QuestionForClient, Specialty, AnswerResult, ClientAnswer } from '@/types/exam'

// CIFRHS 2025: 280 reactivos (250 español + 30 inglés), 5 horas, 4 opciones
export const CIFRHS = {
  totalReactivos:    280,
  reactivosEspanol:  250,
  reactivosIngles:   30,
  tiempoLimiteSecs:  5 * 60 * 60,
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
    perSpecialty:   56,
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
    idioma?: string
    casoId?: string
    casoOrder?: number
    casoTotal?: number
  }>

  _banco = data.map(q => {
    const incorrectas = q.respuestas_incorrectas.slice(0, CIFRHS.opcionesPorReactivo - 1)
    return {
      id: q.id,
      caso: q.caso,
      opciones: shuffle([q.respuesta_correcta, ...incorrectas]),
      respuesta_correcta: q.respuesta_correcta,
      justificacion: q.justificacion,
      categoria: q.categoria as Specialty,
      dificultad: q.dificultad,
      ...(q.idioma && { idioma: q.idioma as 'es' | 'en' }),
      ...(q.casoId && { casoId: q.casoId }),
      ...(q.casoOrder && { casoOrder: q.casoOrder }),
      ...(q.casoTotal && { casoTotal: q.casoTotal }),
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

export function selectDiagnosticQuestions(): QuestionFull[] {
  const banco = loadBanco()
  const specialties: Specialty[] = ['Medicina Interna', 'Pediatría', 'Ginecología', 'Cirugía', 'Urgencias']
  const selected: QuestionFull[] = []

  for (const sp of specialties) {
    const pool = banco.filter(q => q.categoria === sp)
    selected.push(...shuffle(pool).slice(0, 36))
  }

  return groupSerialCases(selected)
}

export function selectMixedQuestions(
  total: number,
  specialties?: Specialty[],
): QuestionFull[] {
  const banco = loadBanco()
  const pool = specialties?.length
    ? banco.filter(q => specialties.includes(q.categoria))
    : banco
  return groupSerialCases(shuffle(pool).slice(0, total))
}

// CIFRHS 2025: 280 total, incluye ~30 en inglés
export function selectSimulatorQuestions(): QuestionFull[] {
  const banco = loadBanco()
  const specialties: Specialty[] = ['Medicina Interna', 'Pediatría', 'Ginecología', 'Cirugía', 'Urgencias']

  const englishQs = banco.filter(q => q.idioma === 'en')
  const englishIds = new Set(englishQs.map(q => q.id))
  const selected: QuestionFull[] = [...englishQs]

  const remaining = CIFRHS.totalReactivos - selected.length
  const perSpecialty = Math.floor(remaining / specialties.length)

  for (const sp of specialties) {
    const pool = banco.filter(q => q.categoria === sp && !englishIds.has(q.id))
    selected.push(...shuffle(pool).slice(0, perSpecialty))
  }

  return groupSerialCases(selected)
}

export function groupSerialCases(questions: QuestionFull[]): QuestionFull[] {
  const serial = new Map<string, QuestionFull[]>()
  const standalone: QuestionFull[] = []

  for (const q of questions) {
    if (q.casoId) {
      const group = serial.get(q.casoId) || []
      group.push(q)
      serial.set(q.casoId, group)
    } else {
      standalone.push(q)
    }
  }

  for (const group of serial.values()) {
    group.sort((a, b) => a.id - b.id)
  }

  const result = shuffle(standalone)
  for (const group of serial.values()) {
    const pos = Math.floor(Math.random() * (result.length + 1))
    result.splice(pos, 0, ...group)
  }

  return result
}

export function toClientQuestion(q: QuestionFull): QuestionForClient {
  return {
    id: q.id,
    caso: q.caso,
    opciones: q.opciones,
    categoria: q.categoria,
    dificultad: q.dificultad,
    ...(q.idioma && { idioma: q.idioma }),
    ...(q.casoId && { casoId: q.casoId }),
    ...(q.casoOrder && { casoOrder: q.casoOrder }),
    ...(q.casoTotal && { casoTotal: q.casoTotal }),
  }
}

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
