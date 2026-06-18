/**
 * Test end-to-end de todos los simuladores de ENARM IQ
 * Usa Firebase Admin para crear token de test → obtiene cookie → prueba cada módulo
 */

import admin from 'firebase-admin'

const PROJECT_ID    = process.env.FIREBASE_ADMIN_PROJECT_ID ?? 'enarm-iq'
const API_KEY       = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? ''
const BASE_URL      = process.env.TEST_BASE_URL ?? 'http://localhost:3000'
const TEST_EMAIL    = process.env.TEST_EMAIL ?? 'test_auto@enarm-iq.dev'
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? 'TestENARM2025!'

if (!API_KEY) {
  console.error('Set NEXT_PUBLIC_FIREBASE_API_KEY env var')
  process.exit(1)
}

// Inicializar Firebase Admin usando las mismas env vars que el server
if (!admin.apps.length) {
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey  = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!clientEmail || !privateKey) {
    console.error('Set FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY env vars')
    process.exit(1)
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   PROJECT_ID.trim(),
      clientEmail: clientEmail.trim(),
      privateKey:  privateKey.trim(),
    }),
  })
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function log(icon, msg) { console.log(`${icon}  ${msg}`) }

// Crear/obtener usuario de test con email verificado
async function getOrCreateTestUser() {
  try {
    const user = await admin.auth().getUserByEmail(TEST_EMAIL)
    if (!user.emailVerified) {
      await admin.auth().updateUser(user.uid, { emailVerified: true })
    }
    await log('👤', `Usuario test existente: ${user.uid}`)
    return user.uid
  } catch {
    const newUser = await admin.auth().createUser({
      email:         TEST_EMAIL,
      password:      TEST_PASSWORD,
      emailVerified: true,
    })
    await log('✨', `Usuario test creado: ${newUser.uid}`)

    // Crear perfil en Firestore para que el login funcione
    const db = admin.firestore()
    await db.collection('users').doc(newUser.uid).set({
      email:             TEST_EMAIL,
      displayName:       'Test Auto',
      createdAt:         Date.now(),
      trialStartedAt:    Date.now(),
      isPaid:            false,
      deviceFingerprint: 'test_auto',
      registrationIp:    '127.0.0.1',
    })
    return newUser.uid
  }
}

// Obtener ID token via Firebase REST API (exchange custom token)
async function getIdToken(uid) {
  const customToken = await admin.auth().createCustomToken(uid)

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token: customToken, returnSecureToken: true }),
    }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(`Firebase REST error: ${JSON.stringify(data)}`)
  return data.idToken
}

// Obtener cookie de sesión del servidor
async function getSessionCookie(idToken) {
  const res = await fetch(`${BASE_URL}/api/auth`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ action: 'login', idToken }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Auth error: ${JSON.stringify(data)}`)

  // Extraer cookie del header Set-Cookie
  const setCookie = res.headers.get('set-cookie') ?? ''
  const match = setCookie.match(/enarm_sess=([^;]+)/)
  if (!match) throw new Error('No se encontró cookie enarm_sess en respuesta')

  return match[1]
}

// Probar un tipo de examen completo
async function testExam(cookie, examType, numQ = 10) {
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': `enarm_sess=${cookie}`,
  }

  // START
  const startRes = await fetch(`${BASE_URL}/api/exam`, {
    method: 'POST', headers,
    body: JSON.stringify({ action: 'start', examType, numQuestions: numQ }),
  })
  const startData = await startRes.json()

  if (!startRes.ok || !startData.questions) {
    return { ok: false, phase: 'start', error: startData.error ?? JSON.stringify(startData) }
  }

  const { sessionId, questions } = startData
  const startedAt = Date.now()

  // Simular respuestas (siempre primera opción)
  const answers = questions.map(q => ({ questionId: q.id, selected: q.opciones[0] }))

  // Para diario: probar partial primero
  if (examType === 'diario' && questions.length > 1) {
    const partialRes = await fetch(`${BASE_URL}/api/exam`, {
      method: 'POST', headers,
      body: JSON.stringify({
        action: 'submit', sessionId,
        answers: [answers[0]], startedAt, partial: true,
      }),
    })
    const partialData = await partialRes.json()
    if (!partialRes.ok || !partialData.answers) {
      return { ok: false, phase: 'partial', error: partialData.error ?? JSON.stringify(partialData) }
    }
  }

  // SUBMIT final
  const submitRes = await fetch(`${BASE_URL}/api/exam`, {
    method: 'POST', headers,
    body: JSON.stringify({ action: 'submit', sessionId, answers, startedAt, partial: false }),
  })
  const submitData = await submitRes.json()

  if (!submitRes.ok || !submitData.sessionId) {
    return { ok: false, phase: 'submit', error: submitData.error ?? JSON.stringify(submitData) }
  }

  return {
    ok:        true,
    questions: questions.length,
    pct:       submitData.pct,
    correctas: submitData.correctAnswers,
    resultId:  submitData.sessionId,
  }
}

// Probar /api/generar
async function testGenerar() {
  const res = await fetch(`${BASE_URL}/api/generar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoria: 'Pediatría' }),
  })
  const data = await res.json()
  if (!res.ok || !data.id) return { ok: false, error: data.error }
  return { ok: true, id: data.id, cat: data.categoria }
}

// ── MAIN ─────────────────────────────────────
async function main() {
  console.log('\n══════════════════════════════════════════')
  console.log('  ENARM IQ — Test automatizado completo')
  console.log(`  ${new Date().toISOString()}`)
  console.log('══════════════════════════════════════════\n')

  // 1. Usuario de test
  const uid = await getOrCreateTestUser()

  // 2. ID Token → Session cookie
  await log('🔑', 'Obteniendo ID token...')
  const idToken = await getIdToken(uid)

  await log('🍪', 'Creando cookie de sesión...')
  const cookie = await getSessionCookie(idToken)
  await log('✅', 'Sesión activa\n')

  // 3. Probar /api/generar (Simulador Pro + Flashcards)
  process.stdout.write('🃏  /api/generar (Simulador Pro)... ')
  const gen = await testGenerar()
  console.log(gen.ok ? `✅ id:${gen.id} cat:${gen.cat}` : `❌ ${gen.error}`)

  // 4. Probar cada tipo de examen
  const EXAMS = [
    { label: 'Simulador Diario         ', type: 'diario',                numQ: 10  },
    { label: 'Examen Personalizado     ', type: 'personalizado',          numQ: 10  },
    { label: 'Diagnóstico Inicial      ', type: 'diagnostico',            numQ: 180 },
    { label: 'Simulador Real (cron.)   ', type: 'simulador_cronometrado', numQ: 360 },
    { label: 'Simulador Sin Límite     ', type: 'simulador_libre',        numQ: 360 },
  ]

  for (const e of EXAMS) {
    process.stdout.write(`📝  ${e.label}... `)
    const r = await testExam(cookie, e.type, e.numQ)
    if (r.ok) {
      console.log(`✅  ${r.questions} preguntas | ${r.pct}% (${r.correctas} correctas) | resultId: ${r.resultId}`)
    } else {
      console.log(`❌  FASE: ${r.phase} | ERROR: ${r.error}`)
    }
    await sleep(500)
  }

  console.log('\n══════════════════════════════════════════')
  console.log('  Test completo')
  console.log('══════════════════════════════════════════\n')
}

main().catch(e => { console.error('\n❌ ERROR FATAL:', e.message); process.exit(1) })
