import admin from 'firebase-admin'
import { adminFirestore } from './firebase-admin'
import { REFERRAL_CREDIT } from './stripe'

export function generateReferralCode(uid: string): string {
  return uid.slice(0, 8).toUpperCase()
}

export async function applyReferralCode(newUserId: string, referralCode: string): Promise<boolean> {
  const db = adminFirestore
  const snap = await db.collection('users')
    .where('referralCode', '==', referralCode.toUpperCase())
    .limit(1).get()
  if (snap.empty) return false
  if (snap.docs[0].id === newUserId) return false
  await db.collection('referrals').add({
    referrerId: snap.docs[0].id,
    referredUserId: newUserId,
    code: referralCode.toUpperCase(),
    createdAt: Date.now(),
    paid: false,
  })
  return true
}

export async function creditReferrerIfExists(paidUserId: string): Promise<void> {
  const db = adminFirestore
  const snap = await db.collection('referrals')
    .where('referredUserId', '==', paidUserId)
    .where('paid', '==', false)
    .limit(1).get()
  if (snap.empty) return
  const referral = snap.docs[0]
  const referrerId = referral.data().referrerId
  const userRef = db.collection('users').doc(referrerId)
  await userRef.update({ creditBalance: admin.firestore.FieldValue.increment(REFERRAL_CREDIT) })
  await referral.ref.update({ paid: true, paidAt: Date.now() })
}

export async function getCreditBalance(uid: string): Promise<number> {
  const snap = await adminFirestore.collection('users').doc(uid).get()
  if (!snap.exists) return 0
  return (snap.data()?.creditBalance ?? 0) as number
}
