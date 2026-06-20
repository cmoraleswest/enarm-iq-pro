import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { adminAuth, adminFirestore } from '@/lib/firebase-admin'

export async function DELETE() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { uid } = session

  try {
    // Borrar sesiones de examen del usuario
    const exams = await adminFirestore
      .collection('examSessions')
      .where('userId', '==', uid)
      .get()

    const batch = adminFirestore.batch()
    for (const doc of exams.docs) {
      batch.delete(doc.ref)
    }

    // Borrar sesiones pendientes
    const pending = await adminFirestore
      .collection('pendingSessions')
      .where('__name__', '>=', uid)
      .where('__name__', '<=', uid + '')
      .get()

    for (const doc of pending.docs) {
      batch.delete(doc.ref)
    }

    // Borrar perfil
    batch.delete(adminFirestore.collection('users').doc(uid))
    await batch.commit()

    // Borrar usuario de Firebase Auth
    await adminAuth.deleteUser(uid)

    // Limpiar cookie
    const cookieStore = await cookies()
    cookieStore.delete('enarm_sess')

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error al eliminar cuenta:', err)
    return NextResponse.json({ error: 'Error al eliminar la cuenta.' }, { status: 500 })
  }
}
