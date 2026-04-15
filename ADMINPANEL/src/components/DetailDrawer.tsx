import {
  ClockCircleOutlined,
  CoffeeOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import { Card, Drawer, Timeline, Typography } from 'antd'
import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import type { DailyRecord, Employee } from '../types/activity'
import { efficiencyColor, minutesToHHMM } from '../lib/format'
import { timelineLabel, UI } from '../lib/labels'
import { ActivityBar } from './ActivityBar'

interface DetailDrawerProps {
  open: boolean
  onClose: () => void
  record: DailyRecord | null
  employee: Employee | undefined
}

export function DetailDrawer({
  open,
  onClose,
  record,
  employee,
}: DetailDrawerProps) {
  if (!record) return null

  const items: {
    color: string
    children: ReactNode
  }[] = []
  let lunchCount = 0
  for (const ev of record.timelineEvents) {
    let label = timelineLabel(ev.type, 0)
    if (ev.type === 'lunch') {
      label = timelineLabel(ev.type, lunchCount)
      lunchCount += 1
    }
    items.push({
      color:
        ev.type === 'door_in'
          ? 'green'
          : ev.type === 'door_out'
            ? 'gray'
            : ev.type === 'lunch'
              ? 'blue'
              : ev.type === 'idle_start'
                ? 'orange'
                : 'cyan',
      children: (
        <div>
          <Typography.Text strong>{ev.timestamp}</Typography.Text>
          <div className="text-zinc-600 dark:text-zinc-300">{label}</div>
        </div>
      ),
    })
  }

  const spark = record.segments.slice(0, 12).map((s, i) => ({
    i,
    h: s.kind === 'active' ? 70 : s.kind === 'idle' ? 35 : 50,
  }))

  return (
    <Drawer
      title={
        <span>
          {UI.detailTitle} — {employee?.name ?? record.employeeName ?? record.employeeId}
        </span>
      }
      placement="right"
      width={420}
      onClose={onClose}
      open={open}
      destroyOnClose
    >
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card size="small">
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <ClockCircleOutlined /> {UI.totalActive}
            </div>
            <div className="text-lg font-semibold">
              {minutesToHHMM(record.activeTime)}
            </div>
          </Card>
          <Card size="small">
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <CoffeeOutlined /> {UI.totalIdle}
            </div>
            <div className="text-lg font-semibold">
              {minutesToHHMM(record.idleTime)}
            </div>
          </Card>
          <Card size="small">
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <RiseOutlined /> {UI.efficiencyScore}
            </div>
            <div
              className="text-lg font-semibold"
              style={{ color: efficiencyColor(record.efficiency) }}
            >
              {record.efficiency}%
            </div>
          </Card>
        </div>

        <div>
          <div className="mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">{UI.barTitle}</div>
          <ActivityBar segments={record.segments} />
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Faol
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> Tushkun
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-sky-500" /> Tushlik
            </span>
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">{UI.timelineTitle}</div>
          <Timeline items={items} />
        </div>

        <div>
          <div className="mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">Faollik grafigi</div>
          <div className="flex h-16 items-end gap-1 rounded-lg border border-zinc-200 p-2 dark:border-zinc-700">
            {spark.map((s) => (
              <div
                key={s.i}
                className="flex-1 rounded-t bg-blue-500/70 dark:bg-blue-400/60"
                style={{ height: `${s.h}%` }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </Drawer>
  )
}
