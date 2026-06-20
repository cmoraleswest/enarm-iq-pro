interface LogoProps {
  size?: number
  textSize?: string
}

export function LogoIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="38" fill="none" stroke="#00d9ff" strokeWidth="2" opacity="0.3"/>
      <path d="M 15 40 L 28 40 L 32 28 L 40 52 L 48 40 L 65 40" fill="none" stroke="#ff006e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="28" cy="40" r="2.5" fill="#ff006e"/>
      <circle cx="48" cy="40" r="2.5" fill="#ff006e"/>
      <circle cx="65" cy="40" r="2.5" fill="#ff006e"/>
    </svg>
  )
}

export function LogoFull({ size = 48, textSize = '1.8rem' }: LogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <LogoIcon size={size} />
      <div style={{ fontFamily: 'DM Sans, Arial, sans-serif', fontWeight: 600, fontSize: textSize, color: '#ffffff', letterSpacing: 1 }}>
        Simula<span style={{ color: '#00d9ff' }}>ENARM</span>
      </div>
    </div>
  )
}

export function LogoText({ textSize = '1.8rem' }: { textSize?: string }) {
  return (
    <div style={{ fontFamily: 'DM Sans, Arial, sans-serif', fontWeight: 600, fontSize: textSize, color: '#ffffff', letterSpacing: 1 }}>
      Simula<span style={{ color: '#00d9ff' }}>ENARM</span>
    </div>
  )
}
