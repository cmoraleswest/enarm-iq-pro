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
  const clientEmail = (process.env.FIREBASE_ADMIN_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@enarm-iq.iam.gserviceaccount.com').trim()
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDQRNbEbzjP7agf\n6ddRLbp6KSYzSYBktiAf75vg97DAha5pJi6b2L4iT0EJuVkIJjnuaEy8h1qZbjHr\n0jeTbZy8XsmjYPnj/DJmJHtGNAJNffMdOq1Y6HQNQuKaQbA8louaefk1EN5YBjvq\nV77zhTntN4IBBM1v89F8IGjvQcgcp589b+wR1+9lXoMYJbudjHKiYCaqJ2d53sA3\ntkvRfTniCH02F/FDC/2qYJ3ZBL4qHs8G33Puvh0UPCrS1lEx/FP5epW7+KKjYTW2\npE5JEF8fK+29j2/RFsE7Y38A1g7BGk48qt9z/8z1QiePAhm6eeBkRO7OdQI7zjOS\nsRraXUohAgMBAAECggEAMN6WTo2SlSe89ZAXWBMU2KljL1Gl8PvTWesNdqJoNSSp\nIj81XJhlNQPHzRJS09i0az7KEsrn9WyoBh/TrqJfzsunINEWkeqRoOoaiwSVLb3K\nGCe2mVAiOyJgrbWQNwdURrEsSslkgt8jm/9u7RFr4D/QH5ES65wYobmxJcMXw7Ed\nBmu+9H8O5HCkwTv1ZYluf8Dur2LZWqt1OJmmyRY6rYwJPqdO10K1z/djgJEoD0uA\n9z5NEh1zUi4vD4eoupYSpvY2H5yULBzTBTdQRtA5J8zaH0mjFcEm9g90anKmwY3d\n/tvYDaTpeAH7SygSUrpeZMiJLOLAUdYPiWY/HkZnYQKBgQDsLJl6bNLBUhpBYmxF\n6DZ9mkWCxEqqzZQk6Ognnl2z78AWBnWSgXfJblNmyoPQJoEYRjBWfwZ2ki6juC4o\n0fiYesUnMHN0lJyltSCslBJG4C5bXUVD9pYELzPh/mIlMDhWepAXGlHyRj+KI8op\nQEeENRiRVIiALlPiCUM/Vrz5vQKBgQDhwI1fj8/Atjd8LT06a2iZ87RAvfvBRpBT\nqFGyjczKb8HY+X0OPbUlxglcnQaQDNAEanbGmQ9scumEFECbq1AfS0m05ho1eIb7\ngzkpJWtM81h/9kjd2uYCA2Otfexzd7OptEpHRtoM8Vd14ShVPvRhdXm1YgUPJOkh\n5tLDkR5ONQKBgC2Gd1tTCNk9E1SRPV/IYGCb0VRgtCfykuD+iGnCrDtYNsXIHvfL\nvyR0AN2qofgIxA/Cz+SMfdlzWkwy36r8tpfl6oUgYNETKJMEtDSwIknJQwZXl1d/\ne/F4i96/Y3nZrrJ007uwViWGhw8A0SJcgqyoc4DoM5vJ0l+a+3yFIs5dAoGAfYz5\nEwyIHkU41nbSdosFwZknxlniibsUyXHy/bqfCnbc+C7IvgLTnA5nZnpuC+8UQWB0\nbj7xtP6zoCEjTXAZP04/z7upF9PQPlDcmWWWJ1WvAnuWSsxS3wvDg9lkh1MrOFZs\nePeOjWQroAN4yvAYOZt79MRuy91bSt90mA89K4ECgYBnjheC4fi596Z/F15wyu79\n/vKYTvTni6sIs+sAk5v+YlgPrJfnNPMUfXtJfLbS/VZO453HXhzYMoa/jBENMWEk\n2vExZpJAHSvDUutQI7mQVYiKbC9pD914IPXI5qx28S0WYD4zx9++Ye7LXxMQiUW/\nZKxiwHXw/iKF1cyLRSxYpA==\n-----END PRIVATE KEY-----\n'
  const privateKey  = rawKey.replace(/\\n/g, '\n').trim()

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
