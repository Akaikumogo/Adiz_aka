import type { ActivitySegment } from '../types/activity'

const COL = {
  active: 'bg-emerald-500 dark:bg-emerald-600',
  idle: 'bg-amber-400/90 dark:bg-amber-500/80',
  lunch: 'bg-sky-500 dark:bg-sky-600',
} as const

export function ActivityBar({ segments }: { segments: ActivitySegment[] }) {
  if (!segments.length) return null
  const start = Math.min(...segments.map((s) => s.startMin))
  const end = Math.max(...segments.map((s) => s.endMin))
  const total = Math.max(1, end - start)

  return (
    <div className="flex h-9 w-full overflow-hidden rounded-lg border border-zinc-200/80 dark:border-zinc-700">
      {segments.map((s, i) => {
        const w = ((s.endMin - s.startMin) / total) * 100
        return (
          <div
            key={i}
            title={`${s.kind} ${s.endMin - s.startMin} daq.`}
            className={`${COL[s.kind]} min-w-[2px] shrink-0 transition-colors`}
            style={{ width: `${w}%` }}
          />
        )
      })}
    </div>
  )
}
