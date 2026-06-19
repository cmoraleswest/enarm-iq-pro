import admin from 'firebase-admin'
import type { App } from 'firebase-admin/app'

// Inicialización diferida — solo cuando se usa, no en import time
let _app: App | undefined

function getApp(): App {
  if (_app) return _app
  if (admin.apps.length > 0) {
    _app = admin.apps[0]!
    return _app
  }

  // .trim() evita \n al final de los valores copiados desde la consola de Firebase
  const projectId   = (process.env.FIREBASE_ADMIN_PROJECT_ID   || 'enarm-iq').trim()
  const clientEmail = (process.env.FIREBASE_ADMIN_CLIENT_EMAIL || '').trim()
  const privateKey  = (process.env.FIREBASE_ADMIN_PRIVATE_KEY  || '').replace(/\\n/g, '\n').trim()

  _app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  })
  return _app
}

export const adminAuth = {
  verifyIdToken: (...args: Parameters<admin.auth.Auth['verifyIdToken']>) =>
    admin.auth(getApp()).verifyIdToken(...args),
  getUser: (...args: Parameters<admin.auth.Auth['getUser']>) =>
    admin.auth(getApp()).getUser(...args),
}

export const adminFirestore = new Proxy({} as admin.firestore.Firestore, {
  get(_target, prop) {
    return (admin.firestore(getApp()) as unknown as Record<string, unknown>)[prop as string]
  },
})

const firebaseAdmin = { app: getApp }
export default firebaseAdmin
