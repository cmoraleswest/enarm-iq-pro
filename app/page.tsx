import { cookies } from "next/headers"

export const metadata = {
  title: "Simula ENARM — Practica hoy. Aprueba manana.",
  description: "Preparate para el ENARM con 2,000 preguntas reales y 5 simuladores. Desde 99 MXN/mes.",
}

export default async function Root() {
  await cookies()
  return <Landing />
}

function Landing() {
  return (
    <main style={{background:"#0a0a14",color:"#e2e8f0",fontFamily:"DM Sans,Arial,sans-serif",minHeight:"100vh"}}>
      <nav style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 40px",borderBottom:"1px solid #1a1a2e",position:"sticky",top:0,background:"#0a0a14",zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10,fontSize:"1.3rem",fontWeight:700}}>
          <svg width="32" height="32" viewBox="0 0 80 80"><circle cx="40" cy="40" r="38" fill="none" stroke="#00d9ff" strokeWidth="2" opacity="0.3"/><path d="M 15 40 L 28 40 L 32 28 L 40 52 L 48 40 L 65 40" fill="none" stroke="#ff006e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="28" cy="40" r="2.5" fill="#ff006e"/><circle cx="48" cy="40" r="2.5" fill="#ff006e"/><circle cx="65" cy="40" r="2.5" fill="#ff006e"/></svg>
          Simula<span style={{color:"#00d9ff"}}>ENARM</span>
        </div>
        <a href="/register" style={{background:"linear-gradient(135deg,#ff006e,#00d9ff)",color:"#fff",border:"none",padding:"10px 20px",borderRadius:10,fontSize:"0.85rem",fontWeight:700,cursor:"pointer",textDecoration:"none"}}>Empieza gratis</a>
      </nav>

      <section style={{minHeight:"90vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"80px 24px",textAlign:"center"}}>
        <div style={{maxWidth:800}}>
          <p style={{color:"#00d9ff",fontSize:"0.72rem",letterSpacing:3,marginBottom:16}}>LA PLATAFORMA DE PREPARACION ENARM MAS ACCESIBLE</p>
          <h1 style={{fontSize:"clamp(2.5rem,6vw,4rem)",fontWeight:700,lineHeight:1.15,marginBottom:24}}>
            Practica hoy.<br/>
            <span style={{background:"linear-gradient(135deg,#ff006e,#00d9ff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Aprueba manana.</span>
          </h1>
          <p style={{fontSize:"1.1rem",color:"#64748b",marginBottom:40,lineHeight:1.7}}>2,000 preguntas reales · 5 simuladores · Estadisticas por especialidad</p>
          <div style={{display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap",marginBottom:48}}>
            <a href="/register" style={{background:"linear-gradient(135deg,#ff006e,#00d9ff)",color:"#fff",border:"none",padding:"16px 32px",borderRadius:12,fontSize:"1rem",fontWeight:700,cursor:"pointer",textDecoration:"none"}}>Empieza gratis 2 dias</a>
            <a href="#precios" style={{background:"transparent",color:"#e2e8f0",border:"1px solid #1a1a2e",padding:"14px 28px",borderRadius:12,fontSize:"1rem",textDecoration:"none"}}>Ver planes</a>
          </div>
          <div style={{display:"flex",gap:40,justifyContent:"center",flexWrap:"wrap"}}>
            {[["2,000","Preguntas reales"],["5","Simuladores"],["$99","MXN/mes"],["38%","Aprueba el ENARM"]].map(([n,l])=>(
              <div key={l} style={{textAlign:"center"}}>
                <div style={{fontSize:"2rem",fontWeight:700,background:"linear-gradient(135deg,#ff006e,#00d9ff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{n}</div>
                <div style={{color:"#475569",fontSize:"0.82rem",marginTop:4}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{background:"#0f0f1a",padding:"80px 24px",textAlign:"center"}}>
        <p style={{color:"#00d9ff",fontSize:"0.72rem",letterSpacing:3,marginBottom:12}}>EL PROBLEMA</p>
        <h2 style={{fontSize:"clamp(1.8rem,4vw,2.5rem)",fontWeight:700,marginBottom:16}}>50,000 medicos presentan el ENARM.<br/>Solo el 38% obtiene plaza.</h2>
        <p style={{color:"#64748b",maxWidth:600,margin:"0 auto",lineHeight:1.7}}>La diferencia no es talento. Es practica constante y medicion real de tu desempeno.</p>
      </section>

      <section style={{padding:"80px 24px"}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          <p style={{color:"#00d9ff",fontSize:"0.72rem",letterSpacing:3,marginBottom:12}}>6 SIMULADORES</p>
          <h2 style={{fontSize:"clamp(1.8rem,4vw,2.5rem)",fontWeight:700,marginBottom:40}}>Todo lo que necesitas para aprobar.</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>
            {[["#ff006e","CADA 30-45 DIAS","Diagnostico Inicial","180 preguntas. Genera tu perfil academico completo."],["#00d9ff","HOY","Simulador Diario","10 preguntas con justificacion inmediata. Habito diario."],["#a78bfa","A TU RITMO","Examen Personalizado","10-40 preguntas. Filtra por especialidad."],["#ff006e","ALTA INTENSIDAD","Simulador Real ENARM","360 preguntas. Cronometro 6 horas. Condiciones reales."],["#00d9ff","ESTUDIO PROFUNDO","Simulador Sin Limite","360 preguntas sin cronometro. Analisis detallado."],["#a78bfa","REPASO RAPIDO","Flashcards","Tarjetas anverso/reverso. Ideal entre pacientes."]].map(([c,t,ti,d])=>(
              <div key={ti as string} style={{background:"#0f0f1a",border:"1px solid #1a1a2e",borderRadius:16,padding:28}}>
                <p style={{color:c as string,fontSize:"0.68rem",letterSpacing:2,marginBottom:8}}>{t}</p>
                <h3 style={{fontSize:"1rem",fontWeight:600,marginBottom:8}}>{ti}</h3>
                <p style={{color:"#475569",fontSize:"0.83rem",lineHeight:1.6}}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="precios" style={{background:"#0f0f1a",padding:"80px 24px",textAlign:"center"}}>
        <p style={{color:"#00d9ff",fontSize:"0.72rem",letterSpacing:3,marginBottom:12}}>PRECIOS</p>
        <h2 style={{fontSize:"clamp(1.8rem,4vw,2.5rem)",fontWeight:700,marginBottom:8}}>Elige tu plan</h2>
        <p style={{color:"#64748b",marginBottom:40}}>2 dias gratis · Sin tarjeta · Cancela cuando quieras</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20,maxWidth:800,margin:"0 auto"}}>
          <div style={{background:"#0a0a14",border:"1px solid #1a1a2e",borderRadius:16,padding:32,textAlign:"left"}}>
            <p style={{color:"#475569",fontSize:"0.75rem",letterSpacing:2}}>MENSUAL</p>
            <div style={{fontSize:"2.2rem",fontWeight:700,margin:"8px 0 4px"}}>$99 <span style={{fontSize:"1rem",color:"#475569"}}>MXN</span></div>
            <p style={{color:"#475569",fontSize:"0.82rem",marginBottom:20}}>por mes</p>
            <a href="/register" style={{display:"block",textAlign:"center",border:"1px solid #1a1a2e",color:"#e2e8f0",padding:"12px",borderRadius:10,textDecoration:"none"}}>Empezar</a>
          </div>
          <div style={{background:"linear-gradient(135deg,#00d9ff08,#ff006e08)",border:"1px solid #00d9ff44",borderRadius:16,padding:32,textAlign:"left"}}>
            <span style={{background:"linear-gradient(135deg,#ff006e,#00d9ff)",color:"#fff",fontSize:"0.68rem",fontWeight:700,padding:"4px 10px",borderRadius:20,display:"inline-block",marginBottom:12}}>MAS POPULAR · AHORRA 41%</span>
            <p style={{color:"#475569",fontSize:"0.75rem",letterSpacing:2}}>ANUAL</p>
            <div style={{fontSize:"2.2rem",fontWeight:700,margin:"8px 0 4px"}}>$599 <span style={{fontSize:"1rem",color:"#475569"}}>MXN</span></div>
            <p style={{color:"#475569",fontSize:"0.82rem",marginBottom:20}}>por ano · equivale a $50/mes</p>
            <a href="/register" style={{display:"block",textAlign:"center",background:"linear-gradient(135deg,#ff006e,#00d9ff)",color:"#fff",padding:"12px",borderRadius:10,textDecoration:"none",fontWeight:700}}>Empezar gratis</a>
          </div>
        </div>
      </section>

      <section style={{padding:"80px 24px",textAlign:"center"}}>
        <p style={{color:"#00d9ff",fontSize:"0.72rem",letterSpacing:3,marginBottom:12}}>EMPIEZA HOY</p>
        <h2 style={{fontSize:"clamp(1.8rem,4vw,2.5rem)",fontWeight:700,marginBottom:16}}>2 dias gratis. Sin tarjeta.</h2>
        <a href="/register" style={{display:"inline-block",background:"linear-gradient(135deg,#ff006e,#00d9ff)",color:"#fff",padding:"18px 40px",borderRadius:12,fontSize:"1.1rem",fontWeight:700,textDecoration:"none"}}>Crear cuenta gratis</a>
      </section>

      <footer style={{borderTop:"1px solid #1a1a2e",padding:"40px 24px",textAlign:"center"}}>
        <div style={{display:"flex",gap:20,justifyContent:"center",flexWrap:"wrap",marginBottom:12}}>
          {[["Terminos","/terminos"],["Privacidad","/privacidad"],["Aviso de Privacidad","/aviso-privacidad"],["Acceso a la app","/login"],["contacto@simulaenarm.com","mailto:contacto@simulaenarm.com"]].map(([l,h])=>(
            <a key={h as string} href={h as string} style={{color:"#334155",fontSize:"0.78rem",textDecoration:"none"}}>{l}</a>
          ))}
        </div>
        <p style={{color:"#334155",fontSize:"0.78rem",marginBottom:8}}>2026 SimulaENARM. Todos los derechos reservados. Cuernavaca, Morelos, Mexico</p>
        <p style={{color:"#1e293b",fontSize:"0.7rem",maxWidth:680,margin:"0 auto",lineHeight:1.6}}>Simula ENARM es una plataforma educativa independiente. No esta afiliada a la CIFRHS ni a la Secretaria de Salud. El termino ENARM es meramente descriptivo. Pagos procesados por Stripe. SimulaENARM marca en tramite ante el IMPI.</p>
      </footer>
    </main>
  )
}
