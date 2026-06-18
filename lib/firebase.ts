import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

// Inicialización diferida — evita crash durante SSR/build sin env vars
let _app: FirebaseApp | null = null

function getApp(): FirebaseApp {
  if (_app) return _app
  const existing = getApps()
  if (existing.length > 0) {
    _app = existing[0]
    return _app
  }
  _app = initializeApp({
    apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  })
  return _app
}

export function getFirebaseAuth(): Auth     { return getAuth(getApp()) }
export function getFirebaseDb(): Firestore  { return getFirestore(getApp()) }

// Compatibilidad con código que importa directamente `auth` y `db`
export const auth = new Proxy({} as Auth, {
  get(_t, prop) { return (getFirebaseAuth() as unknown as Record<string, unknown>)[prop as string] },
})
export const db = new Proxy({} as Firestore, {
  get(_t, prop) { return (getFirebaseDb() as unknown as Record<string, unknown>)[prop as string] },
})

const firebase = { getApp }
export default firebase
