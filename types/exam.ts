export type ExamType =
  | 'diagnostico'
  | 'diario'
  | 'personalizado'
  | 'simulador_cronometrado'
  | 'simulador_libre'

export type Specialty =
  | 'Medicina Interna'
  | 'Pediatría'
  | 'Ginecología'
  | 'Cirugía'
  | 'Urgencias'

export const ALL_SPECIALTIES: Specialty[] = [
  'Medicina Interna',
  'Pediatría',
  'Ginecología',
  'Cirugía',
  'Urgencias',
]

// Pregunta que se envía al cliente durante el examen (sin respuesta correcta)
export interface QuestionForClient {
  id: number
  caso: string
  opciones: string[]
  categoria: Specialty
  dificultad: string
  idioma?: 'es' | 'en'
  casoId?: string
  casoOrder?: number
  casoTotal?: number
}

// Pregunta completa del banco (solo en servidor)
export interface QuestionFull extends QuestionForClient {
  respuesta_correcta: string
  justificacion: string
}

// Respuesta del cliente al momento de enviar
export interface ClientAnswer {
  questionId: number
  selected: string
}

// Resultado detallado de una pregunta después de calificar
export interface AnswerResult {
  questionId: number
  caso: string
  selected: string
  correcta: string
  isCorrect: boolean
  justificacion: string
  categoria: Specialty
  dificultad: string
}

// Sesión de examen (guardada en Firestore)
export interface ExamSession {
  id: string
  userId: string
  examType: ExamType
  startedAt: number
  finishedAt: number
  timeTakenSeconds: number
  totalQuestions: number
  correctAnswers: number
  specialties: Specialty[]
  answers: AnswerResult[]
  bySpecialty: SpecialtyStats[]
}

export interface SpecialtyStats {
  specialty: Specialty
  total: number
  correct: number
  pct: number
}

export interface DiagnosticSnapshot {
  sessionId: string
  takenAt: number
  overallPct: number
  bySpecialty: SpecialtyStats[]
}

export interface SessionSummary {
  sessionId: string
  examType: ExamType
  finishedAt: number
  totalQuestions: number
  correctAnswers: number
  pct: number
  timeTakenSeconds: number
}

export interface UserStats {
  totalSessions: number
  totalQuestions: number
  totalCorrect: number
  overallPct: number
  bySpecialty: SpecialtyStats[]
  diagnosticHistory: DiagnosticSnapshot[]
  lastDiagnosticAt: number | null
  sessionHistory: SessionSummary[]
}

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  createdAt: number
  isPaid: boolean
  deviceFingerprint: string
  registrationIp: string
  paidAt?: number
  promoCode?: string
  influencerId?: string
  stripeCustomerId?: string
}

// Respuesta del API /api/exam al iniciar
export interface StartExamResponse {
  sessionId: string
  questions: QuestionForClient[]
  examType: ExamType
  timeLimitSeconds: number | null // null = sin límite
}

// Respuesta del API /api/exam al calificar
export interface SubmitExamResponse {
  sessionId: string
  correctAnswers: number
  totalQuestions: number
  pct: number
  timeTakenSeconds: number
  bySpecialty: SpecialtyStats[]
  answers: AnswerResult[]
  examType: ExamType
}
