// Umbrales históricos CIFRHS por especialidad (puntaje normalizado 0-100)
export interface UmbralEspecialidad {
  nombre: string
  plazas: number
  minHistorico: number // puntaje mínimo para selección 1ra vuelta
  maxHistorico: number
}

export const ESPECIALIDADES_CIFRHS: UmbralEspecialidad[] = [
  { nombre: 'Medicina Interna',            plazas: 1_832, minHistorico: 62.50, maxHistorico: 84.38 },
  { nombre: 'Cirugía General',             plazas: 1_200, minHistorico: 59.14, maxHistorico: 81.25 },
  { nombre: 'Pediatría',                   plazas: 1_450, minHistorico: 60.00, maxHistorico: 82.50 },
  { nombre: 'Ginecología y Obstetricia',   plazas: 1_350, minHistorico: 61.25, maxHistorico: 83.13 },
  { nombre: 'Medicina Familiar',           plazas: 3_500, minHistorico: 50.00, maxHistorico: 75.00 },
  { nombre: 'Anestesiología',              plazas: 950,   minHistorico: 63.75, maxHistorico: 85.00 },
  { nombre: 'Urgencias Médico-Quirúrgicas',plazas: 800,   minHistorico: 58.75, maxHistorico: 80.00 },
  { nombre: 'Traumatología y Ortopedia',   plazas: 700,   minHistorico: 60.63, maxHistorico: 82.50 },
  { nombre: 'Psiquiatría',                 plazas: 450,   minHistorico: 61.88, maxHistorico: 83.75 },
  { nombre: 'Radiología e Imagen',         plazas: 380,   minHistorico: 65.00, maxHistorico: 86.25 },
  { nombre: 'Oftalmología',                plazas: 280,   minHistorico: 66.25, maxHistorico: 87.50 },
  { nombre: 'Otorrinolaringología',        plazas: 250,   minHistorico: 64.38, maxHistorico: 85.63 },
  { nombre: 'Dermatología',                plazas: 200,   minHistorico: 67.50, maxHistorico: 88.75 },
  { nombre: 'Medicina del Enfermo en Estado Crítico', plazas: 350, minHistorico: 63.13, maxHistorico: 84.38 },
  { nombre: 'Neonatología',                plazas: 300,   minHistorico: 64.38, maxHistorico: 85.63 },
]

export type EstatusSeleccion = 'SELECCIONADO_1RA' | 'DISPONIBLE_2DA' | 'NO_SELECCIONADO'

export function calcularEstatus(pctScore: number, especialidad: string): {
  estatus: EstatusSeleccion
  label: string
  color: string
  descripcion: string
} {
  const esp = ESPECIALIDADES_CIFRHS.find(e => e.nombre === especialidad)
  if (!esp) {
    return { estatus: 'NO_SELECCIONADO', label: 'SIN DATOS', color: '#64748b', descripcion: 'Especialidad no encontrada en base CIFRHS' }
  }

  if (pctScore >= esp.minHistorico) {
    return {
      estatus: 'SELECCIONADO_1RA',
      label: 'SELECCIONADO EN 1RA VUELTA',
      color: '#4ade80',
      descripcion: `Tu puntaje (${pctScore.toFixed(1)}%) supera el mínimo histórico (${esp.minHistorico}%) para ${esp.nombre}`,
    }
  }

  // Zona de 2da vuelta: entre 85% del mínimo y el mínimo
  const umbral2da = esp.minHistorico * 0.85
  if (pctScore >= umbral2da) {
    return {
      estatus: 'DISPONIBLE_2DA',
      label: 'DISPONIBLE PARA 2DA VUELTA',
      color: '#fbbf24',
      descripcion: `Tu puntaje (${pctScore.toFixed(1)}%) está cerca del umbral (${esp.minHistorico}%). Posibilidad en 2da vuelta.`,
    }
  }

  return {
    estatus: 'NO_SELECCIONADO',
    label: 'NO SELECCIONADO',
    color: '#f87171',
    descripcion: `Tu puntaje (${pctScore.toFixed(1)}%) está por debajo del umbral mínimo (${esp.minHistorico}%) para ${esp.nombre}`,
  }
}

// Percentil estimado contra 45,000 aspirantes
export function calcularPercentil(pctScore: number): number {
  // Distribución aproximada: media ~55%, desviación ~12%
  const z = (pctScore - 55) / 12
  const percentil = Math.round(cdfNormal(z) * 100)
  return Math.max(1, Math.min(99, percentil))
}

// Aproximación de CDF normal estándar
function cdfNormal(z: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911
  const sign = z < 0 ? -1 : 1
  const x = Math.abs(z) / Math.sqrt(2)
  const t = 1.0 / (1.0 + p * x)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
  return 0.5 * (1.0 + sign * y)
}
