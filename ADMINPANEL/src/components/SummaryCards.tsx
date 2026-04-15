import {
  ClockCircleOutlined,
  CoffeeOutlined,
  RiseOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { Card, Statistic } from 'antd'
import { motion } from 'framer-motion'
import { minutesToHHMM } from '../lib/format'
import { UI } from '../lib/labels'

interface SummaryCardsProps {
  totalEmployees: number
  activeToday: number
  avgEfficiency: number
  totalActiveMinutes: number
  totalIdleMinutes: number
  trendEff?: number
}

export function SummaryCards({
  totalEmployees,
  activeToday,
  avgEfficiency,
  totalActiveMinutes,
  totalIdleMinutes,
  trendEff = 2.4,
}: SummaryCardsProps) {
  const items = [
    {
      title: UI.kpiTotal,
      value: totalEmployees,
      icon: <TeamOutlined className="text-lg text-blue-500" />,
      suffix: '',
      trend: null as string | null,
    },
    {
      title: UI.kpiActiveToday,
      value: activeToday,
      icon: <ThunderboltOutlined className="text-lg text-emerald-500" />,
      suffix: '',
      trend: '+1',
    },
    {
      title: UI.kpiAvgEff,
      value: avgEfficiency,
      icon: <RiseOutlined className="text-lg text-violet-500" />,
      suffix: '%',
      trend: trendEff >= 0 ? `+${trendEff}%` : `${trendEff}%`,
    },
    {
      title: UI.kpiWorkHours,
      value: minutesToHHMM(totalActiveMinutes),
      icon: <ClockCircleOutlined className="text-lg text-cyan-500" />,
      suffix: '',
      trend: null,
    },
    {
      title: UI.kpiIdle,
      value: minutesToHHMM(totalIdleMinutes),
      icon: <CoffeeOutlined className="text-lg text-amber-500" />,
      suffix: '',
      trend: '-3%',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((it, i) => (
        <motion.div
          key={it.title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Card size="small" className="h-full border-zinc-200/90 dark:border-zinc-800">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {it.title}
                </div>
                <Statistic
                  value={it.value}
                  suffix={it.suffix}
                  styles={{ content: { fontSize: 22, fontWeight: 600 } }}
                />
                {it.trend && (
                  <div className="mt-1 text-xs text-zinc-400">
                    {it.trend.includes('-') ? '↓' : '↑'} {it.trend}{' '}
                    {it.title === UI.kpiIdle ? UI.trendDown : UI.trendUp}
                  </div>
                )}
              </div>
              <div className="rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800">
                {it.icon}
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
