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
