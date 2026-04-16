/** Format seconds as "H soat M daq" / "M daq" */
export function formatDurationSeconds(sec: number): string {
  if (!sec || sec < 0) return '0 daq'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h <= 0) return `${m} daq`
  if (m <= 0) return `${h} soat`
  return `${h} soat ${m} daq`
}

export function minutesToHHMM(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function efficiencyTone(eff: number): 'success' | 'warning' | 'exception' {
  if (eff >= 80) return 'success'
  if (eff >= 50) return 'warning'
  return 'exception'
}

export function efficiencyColor(eff: number): string {
  if (eff >= 80) return '#22c55e'
  if (eff >= 50) return '#eab308'
  return '#ef4444'
}
