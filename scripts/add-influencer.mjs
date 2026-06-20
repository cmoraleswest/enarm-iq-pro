#!/usr/bin/env node
/**
 * Uso: node scripts/add-influencer.mjs CODIGO "Nombre" "TikTok"
 * Agrega un influencer a la colección `influencers` en Firestore.
 * Requiere las env vars de Firebase Admin (FIREBASE_ADMIN_*).
 * El cupón en Stripe se crea manualmente desde el Dashboard.
 */
import admin from 'firebase-admin'

const [,, promoCode, name, platform = 'TikTok'] = process.argv

if (!promoCode || !name) {
  console.error('Uso: node scripts/add-influencer.mjs CODIGO "Nombre" "Plataforma"')
  console.error('Ejemplo: node scripts/add-influencer.mjs DRPOLO "Dr. Polo" "TikTok"')
  process.exit(1)
}

if (!process.env.FIREBASE_ADMIN_PROJECT_ID) {
  console.error('Falta FIREBASE_ADMIN_PROJECT_ID. Ejecuta con las env vars de Firebase Admin.')
  console.error('Tip: vercel env pull .env.local && source <(grep FIREBASE .env.local | sed "s/^/export /")')
  process.exit(1)
}

const app = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID.trim(),
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL.trim(),
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n').trim(),
  }),
})

const db = admin.firestore(app)

const doc = {
  promoCode: promoCode.toUpperCase(),
  name,
  platform,
  createdAt: Date.now(),
  totalReferrals: 0,
  totalRevenue: 0,
}

await db.collection('influencers').doc(promoCode.toUpperCase()).set(doc)
console.log(`✓ Influencer agregado:`)
console.log(JSON.stringify(doc, null, 2))
console.log(`\n⚠️  Recuerda crear el cupón "${promoCode.toUpperCase()}" en Stripe Dashboard:`)
console.log('   https://dashboard.stripe.com/coupons/create')

process.exit(0)
