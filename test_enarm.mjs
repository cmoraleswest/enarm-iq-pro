/**
 * Test end-to-end de todos los simuladores de ENARM IQ
 * Usa Firebase Admin para crear token de test → obtiene cookie → prueba cada módulo
 */

import admin from 'firebase-admin'

const PROJECT_ID    = 'enarm-iq'
const API_KEY       = 'AIzaSyDquVZNBV5o-WM-ZeJFoTS-2IsLIk6s98k'
const BASE_URL      = 'https://enarm-iq.vercel.app'
const TEST_EMAIL    = 'test_auto@enarm-iq.dev'
const TEST_PASSWORD = 'TestENARM2025!'

const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDED2ECWzlsJWxw
qUXFAwN8pD13t8qxxr2huQtwvb8OlUwWA5uYzBtNtxqrFOlKMVjrkRR8d9u7Dpy0
QB/UaorxJp4SoT8vPx/or0Qp8Nm2g0McVfKJ0N8HBS8XWnjX/E1h1ajdMcdvnqqI
++CJocuFKWs2Nx7afQAfU9vbZNiQne+wa9CEUrSA2Lc9d8zLt2ea9jv1H8pIqzDv
wzyzB8aSb/uvZPKZRZHp2wt333Zlq5l3lJGKP1ll3RpaRoh9YAOviNrl2tsVE51S
DUjPfKshbHJUsMxcvPEq97DqMgIE8WceEPfA5ADion8RnBdfputhIdbtS1Rm7rO6
obhkCaqHAgMBAAECggEAIlyHpgAS+k88yCoCnlq+27N1SmwdzDaGubdSt/mpaIbm
BN2xAYCUMHSs6dsKYARyDycoLgBbtFcFQ9oROgtKOqWIAr/b8Q3hK8i765XYslIj
Cu5NSbYfwH06GZ+zmjcP4NuvcsTsrTVjsgpi+fwvTTFLJv9WGvjZcqQh3ju4cO/O
qLGIdtVB89eYm609+yJ7j504botmy0lVSCEVcQEEZ9dKA9CuW0IjEeH+lkbelJ9h
NLZ1P7Z1jC+yQo5yddL4FHjzBA3dKdQK1elRmR+QFErP/ms+Dmi7zgIv59Z2KQRd
bKbo0UOHzwrDVwzWua8qRjD5OpatZt0BF9cFlYhEkQKBgQDme9FGZB9ByS+b81y1
i12KzGZmfoya30fZniypFOeBJ0uozgUpHitt5wmgFcEgXsxASxyqkgVngjwkw7pr
HssXJ3Yzq5nz5NEY83SGs2/KwFLZ40Nsm8iB8ytfMDQSBRxCSgQGvd6S6jJvQovV
nb6GqA6eBpO9LWsNkiR09W4ZEwKBgQDZw/Sw5hR+rxFFS9j+A1Dui8UDEdY+BGuq
BOjIy36Em7EkfyhgD1nVHGzvRxKuvpIw62UXjb2jjgPdEM21O96noSVuXuuDTPCd
u/rhhpsMESfDp4PUarorORdMSab4Qe1WuxSez04nWWwha6evwmaLYnsNfnS6F+UX
2kzpSXqrPQKBgEyruaUp3z/6Fg1RunBl6PsoHZRQ2qMWTYd117NzUcOj98YyqoLQ
F3Ba39fSBMmo31cv5VxUcNnK+Aje11+VAcg1B1wO5Iq+flRHgGbiv/h5W9ZBhIdX
ly6rXq0uktO/wXPHvWkktiq3H4nlYDDyZZPTyfEFjRXsSuVbzSbfEf3jAoGBAMPe
SEGwwPBtgOhGX4eh7fKSDwNC0OP5T+md/s9UkZiu/TcplGRKim9v4N+bmsdIK/AK
WmREHjV1MC5vxcbkcdFu1V8fy0/PLYGCqhad3umMqKqICsBNuuPTtwvsF12m1tYy
8UoihlZITUUGMs6Y2Wk3jBzICC+1/F5nANS4Pbi1AoGBANY7lbuOI9Cn4HKcbQpJ
5DY4+02BP7qJz6dS6Osqy++uyk7HBZjzVplHS/LY/CAMVBcLNWAbulyqHa9V9Moi
X4uoRdgS7B/fe8Kz8d27HSILm30BJfiKmQm28xZsibB880awG59goNKd9U+9/uve
l3Jy339F0kYhuZbjM7g09R7M
-----END PRIVATE KEY-----`

const CLIENT_EMAIL = 'firebase-adminsdk-fbsvc@enarm-iq.iam.gserviceaccount.com'

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   PROJECT_ID.trim(),
      clientEmail: CLIENT_EMAIL.trim(),
      privateKey:  PRIVATE_KEY.trim(),
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
