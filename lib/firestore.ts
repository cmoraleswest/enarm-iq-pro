import { adminFirestore } from './firebase-admin'
import type {
  UserProfile, ExamSession, SubmitExamResponse,
  AnswerResult, SpecialtyStats, Specialty, DiagnosticSnapshot, UserStats, SessionSummary,
} from '@/types/exam'
import { TRIAL_MS } from './constants'

export { TRIAL_MS }

// ──────────────────────────────────────────────
// USUARIOS
// ──────────────────────────────────────────────

export async function createUserProfile(
  uid: string,
  email: string,
  fingerprint: string,
  ip: string,
): Promise<void> {
  const profile: Omit<UserProfile, 'uid'> = {
    email,
    displayName: email.split('@')[0],
    createdAt: Date.now(),
    trialStartedAt: Date.now(), // el trial empieza al registrarse
    isPaid: false,
    deviceFingerprint: fingerprint,
    registrationIp: ip,
  }
  await adminFirestore.collection('users').doc(uid).set(profile)
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await adminFirestore.collection('users').doc(uid).get()
  if (!snap.exists) return null
  return { uid, ...snap.data() } as UserProfile
}

export function isTrialActive(profile: UserProfile): boolean {
  if (profile.isPaid) return true
  if (!profile.trialStartedAt) return false
  return Date.now() < profile.trialStartedAt + TRIAL_MS
}

export function trialDaysLeft(profile: UserProfile): number {
  if (profile.isPaid) return Infinity
  if (!profile.trialStartedAt) return 0
  const left = (profile.trialStartedAt + TRIAL_MS) - Date.now()
  return Math.max(0, Math.ceil(left / (24 * 60 * 60 * 1000)))
}

// Detección de fraude: mismo fingerprint o IP ya usó trial
export async function detectFraud(fingerprint: string, ip: string): Promise<boolean> {
  const db = adminFirestore

  // Buscar por fingerprint
  const fpSnap = await db.collection('users')
    .where('deviceFingerprint', '==', fingerprint)
    .where('isPaid', '==', false)
    .limit(1)
    .get()

  if (!fpSnap.empty) {
    const user = fpSnap.docs[0].data()
    const started = user.trialStartedAt as number | null
    // Si el trial ya expiró en ese dispositivo → fraude
    if (started && Date.now() > started + TRIAL_MS) return true
  }

  // Buscar por IP (menos restrictivo — solo bloquear si ya expiró)
  if (ip && ip !== 'unknown') {
    const ipSnap = await db.collection('users')
      .where('registrationIp', '==', ip)
      .where('isPaid', '==', false)
      .limit(3)
      .get()

    let expiredCount = 0
    for (const doc of ipSnap.docs) {
      const u = doc.data()
      if (u.trialStartedAt && Date.now() > u.trialStartedAt + TRIAL_MS) {
        expiredCount++
      }
    }
    // Bloquear si hay 2+ cuentas expiradas en la misma IP
    if (expiredCount >= 2) return true
  }

  return false
}

// ──────────────────────────────────────────────
// SESIONES PENDIENTES (serverless-safe)
// En lugar de Map en memoria (se pierde entre instancias Vercel),
// guardamos solo los IDs de preguntas en Firestore.
// ──────────────────────────────────────────────

export async function storePendingSession(
  sessionId: string,
  questionIds: number[],
  examType: string,
  specialties: string[],
  startedAt: number,
): Promise<void> {
  await adminFirestore.collection('pendingSessions').doc(sessionId).set({
    questionIds,
    examType,
    specialties,
    startedAt,
    createdAt: Date.now(),
  })
}

export async function fetchPendingSession(sessionId: string): Promise<{
  questionIds: number[]
  examType: string
  specialties: string[]
  startedAt: number
} | null> {
  const snap = await adminFirestore.collection('pendingSessions').doc(sessionId).get()
  if (!snap.exists) return null
  return snap.data() as { questionIds: number[]; examType: string; specialties: string[]; startedAt: number }
}

export async function removePendingSession(sessionId: string): Promise<void> {
  await adminFirestore.collection('pendingSessions').doc(sessionId).delete()
}

// ──────────────────────────────────────────────
// SESIONES DE EXAMEN
// ──────────────────────────────────────────────

export async function saveExamSession(session: Omit<ExamSession, 'id'>): Promise<string> {
  const ref = await adminFirestore.collection('examSessions').add(session)
  return ref.id
}

export async function getExamSession(sessionId: string): Promise<ExamSession | null> {
  const snap = await adminFirestore.collection('examSessions').doc(sessionId).get()
  if (!snap.exists) return null
  return { id: sessionId, ...snap.data() } as ExamSession
}

export async function getUserSessions(userId: string, limit = 20): Promise<ExamSession[]> {
  const snap = await adminFirestore
    .collection('examSessions')
    .where('userId', '==', userId)
    .orderBy('finishedAt', 'desc')
    .limit(limit)
    .get()
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as ExamSession)
}

// ──────────────────────────────────────────────
// ESTADÍSTICAS GLOBALES DEL USUARIO
// ──────────────────────────────────────────────

export async function getUserStats(userId: string): Promise<UserStats> {
  const sessions = await getUserSessions(userId, 100)

  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      overallPct: 0,
      bySpecialty: [],
      diagnosticHistory: [],
      lastDiagnosticAt: null,
      sessionHistory: [],
    }
  }

  let totalQ = 0
  let totalC = 0
  const specialtyMap: Record<string, { total: number; correct: number }> = {}

  for (const s of sessions) {
    totalQ += s.totalQuestions
    totalC += s.correctAnswers
    for (const ans of s.answers) {
      const sp = ans.categoria as string
      if (!specialtyMap[sp]) specialtyMap[sp] = { total: 0, correct: 0 }
      specialtyMap[sp].total++
      if (ans.isCorrect) specialtyMap[sp].correct++
    }
  }

  const bySpecialty: SpecialtyStats[] = Object.entries(specialtyMap).map(([sp, v]) => ({
    specialty: sp as Specialty,
    total: v.total,
    correct: v.correct,
    pct: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
  })).sort((a, b) => b.pct - a.pct)

  // Historial de diagnósticos
  const diagnostics = sessions.filter(s => s.examType === 'diagnostico')
  const diagnosticHistory: DiagnosticSnapshot[] = diagnostics.map(s => ({
    sessionId: s.id,
    takenAt: s.finishedAt,
    overallPct: s.totalQuestions > 0 ? Math.round((s.correctAnswers / s.totalQuestions) * 100) : 0,
    bySpecialty: s.bySpecialty,
  }))

  const sessionHistory: SessionSummary[] = sessions.slice(0, 20).map(s => ({
    sessionId: s.id,
    examType: s.examType,
    finishedAt: s.finishedAt,
    totalQuestions: s.totalQuestions,
    correctAnswers: s.correctAnswers,
    pct: s.totalQuestions > 0 ? Math.round((s.correctAnswers / s.totalQuestions) * 100) : 0,
    timeTakenSeconds: s.timeTakenSeconds,
  }))

  return {
    totalSessions: sessions.length,
    totalQuestions: totalQ,
    totalCorrect: totalC,
    overallPct: totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0,
    bySpecialty,
    diagnosticHistory,
    lastDiagnosticAt: diagnostics[0]?.finishedAt ?? null,
    sessionHistory,
  }
}

// Calcula stats por especialidad de un array de answers
export function calcBySpecialty(answers: AnswerResult[]): SpecialtyStats[] {
  const map: Record<string, { total: number; correct: number }> = {}
  for (const a of answers) {
    if (!map[a.categoria]) map[a.categoria] = { total: 0, correct: 0 }
    map[a.categoria].total++
    if (a.isCorrect) map[a.categoria].correct++
  }
  return Object.entries(map).map(([sp, v]) => ({
    specialty: sp as Specialty,
    total: v.total,
    correct: v.correct,
    pct: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
  }))
}

// Construye respuesta del submit y guarda en Firestore
export async function gradeAndSave(
  userId: string,
  examType: ExamSession['examType'],
  answers: AnswerResult[],
  startedAt: number,
  specialties: Specialty[],
): Promise<SubmitExamResponse> {
  const finishedAt = Date.now()
  const timeTakenSeconds = Math.round((finishedAt - startedAt) / 1000)
  const correctAnswers = answers.filter(a => a.isCorrect).length
  const bySpecialty = calcBySpecialty(answers)

  const session: Omit<ExamSession, 'id'> = {
    userId,
    examType,
    startedAt,
    finishedAt,
    timeTakenSeconds,
    totalQuestions: answers.length,
    correctAnswers,
    specialties,
    answers,
    bySpecialty,
  }

  const sessionId = await saveExamSession(session)

  return {
    sessionId,
    correctAnswers,
    totalQuestions: answers.length,
    pct: answers.length > 0 ? Math.round((correctAnswers / answers.length) * 100) : 0,
    timeTakenSeconds,
    bySpecialty,
    answers,
    examType,
  }
}
