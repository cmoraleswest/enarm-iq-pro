'use client'

import { useEffect, useState, useCallback } from 'react'

export default function NotificationPrompt() {
  const [show, setShow] = useState(false)

  const scheduleReminder = useCallback(async () => {
    const reg = await navigator.serviceWorker.ready
    reg.active?.postMessage({ type: 'SCHEDULE_REMINDER' })
  }, [])

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return
    if (Notification.permission === 'default' && !localStorage.getItem('enarm_notif_dismissed')) {
      setTimeout(() => setShow(true), 5000)
    }
    if (Notification.permission === 'granted') scheduleReminder()
  }, [scheduleReminder])

  async function handleAllow() {
    const perm = await Notification.requestPermission()
    if (perm === 'granted') scheduleReminder()
    setShow(false)
  }

  function handleDismiss() {
    localStorage.setItem('enarm_notif_dismissed', '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, backgroundColor: '#111827', border: '1px solid #D4AF37', borderRadius: 14, padding: '16px 20px', maxWidth: 360, width: 'calc(100% - 32px)', fontFamily: 'Georgia, serif', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      <p style={{ color: '#e2e8f0', fontSize: '0.9rem', margin: '0 0 12px 0' }}>
        🔔 ¿Quieres un recordatorio diario para practicar?
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleAllow} style={{ flex: 1, padding: '10px 0', backgroundColor: '#D4AF37', color: '#0a0a14', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'Georgia, serif' }}>
          Activar
        </button>
        <button onClick={handleDismiss} style={{ flex: 1, padding: '10px 0', backgroundColor: 'transparent', border: '1px solid #334155', color: '#64748b', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'Georgia, serif' }}>
          No, gracias
        </button>
      </div>
    </div>
  )
}
