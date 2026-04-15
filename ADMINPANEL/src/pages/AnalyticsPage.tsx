import { Typography, theme, Spin } from 'antd'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { apiFetch } from '../lib/api'
import { UI } from '../lib/labels'

export function AnalyticsPage() {
  const { mode } = useTheme()
  const { token } = theme.useToken()
  const isDark = mode === 'dark'
  const { bootstrapped, isAuthenticated } = useAuth()
  const [from, to] = useMemo(() => {
    const t = dayjs()
    const f = t.subtract(6, 'day')
    return [f.format('YYYY-MM-DD'), t.format('YYYY-MM-DD')] as const
  }, [])

  const { data: trend = [], isLoading: l1 } = useQuery({
    queryKey: ['efficiency-trend', from, to],
    queryFn: () =>
      apiFetch<{ date: string; label: string; avgEfficiency: number }[]>(
        `/api/analytics/efficiency-trend?from=${from}&to=${to}`,
      ),
    enabled: bootstrapped && isAuthenticated,
  })

  const { data: byEmp = [], isLoading: l2 } = useQuery({
    queryKey: ['efficiency-by-employee'],
    queryFn: () =>
      apiFetch<{ employeeId: string; name: string; avgEfficiency: number }[]>(
        '/api/analytics/efficiency-by-employee',
      ),
    enabled: bootstrapped && isAuthenticated,
  })

  const { data: byDept = [], isLoading: l3 } = useQuery({
    queryKey: ['efficiency-by-department'],
    queryFn: () =>
      apiFetch<{ department: string; avgEfficiency: number }[]>(
        '/api/analytics/efficiency-by-department',
      ),
    enabled: bootstrapped && isAuthenticated,
  })

  const { data: kpis } = useQuery({
    queryKey: ['kpis', from, to],
    queryFn: () =>
      apiFetch<{
        totalActiveMinutes: number
        totalIdleMinutes: number
      }>(`/api/analytics/kpis?from=${from}&to=${to}`),
    enabled: bootstrapped && isAuthenticated,
  })

  const loading = l1 || l2 || l3

  const axisColor = token.colorTextSecondary
  const gridColor = isDark ? '#27272a' : '#e4e4e7'
  const tooltipBg = token.colorBgElevated
  const tooltipBorder = token.colorBorderSecondary

  if (!bootstrapped) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <>
      <div className="mb-8">
        <Typography.Title level={3} className="!mb-1 !font-semibold">
          {UI.analyticsTitle}
        </Typography.Title>
        <Typography.Text type="secondary">{UI.analyticsDesc}</Typography.Text>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/80">
          <Typography.Text type="secondary" className="text-xs uppercase">
            {UI.chartActiveIdle}
          </Typography.Text>
          <div className="mt-2 flex gap-8 text-2xl font-semibold">
            <span className="text-emerald-600 dark:text-emerald-400">
              {kpis?.totalActiveMinutes ?? 0} daq
            </span>
            <span className="text-amber-600 dark:text-amber-400">
              {kpis?.totalIdleMinutes ?? 0} daq
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spin />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
            <Typography.Title level={5} className="!mb-4 !font-semibold">
              {UI.chartTrend}
            </Typography.Title>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trend}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={gridColor}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: axisColor, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: axisColor, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: tooltipBg,
                      border: `1px solid ${tooltipBorder}`,
                      borderRadius: 8,
                    }}
                    labelStyle={{ color: token.colorText }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avgEfficiency"
                    name={UI.colEfficiency}
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
            <Typography.Title level={5} className="!mb-4 !font-semibold">
              {UI.chartByEmployee}
            </Typography.Title>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={byEmp}
                  layout="vertical"
                  margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={gridColor}
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fill: axisColor, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={72}
                    tick={{ fill: axisColor, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: tooltipBg,
                      border: `1px solid ${tooltipBorder}`,
                      borderRadius: 8,
                    }}
                  />
                  <Bar
                    dataKey="avgEfficiency"
                    name={UI.colEfficiency}
                    fill="#6366f1"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 xl:col-span-2">
            <Typography.Title level={5} className="!mb-4 !font-semibold">
              {UI.chartByDept}
            </Typography.Title>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={byDept}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={gridColor}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="department"
                    tick={{ fill: axisColor, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: axisColor, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: tooltipBg,
                      border: `1px solid ${tooltipBorder}`,
                      borderRadius: 8,
                    }}
                  />
                  <Bar
                    dataKey="avgEfficiency"
                    name={UI.colEfficiency}
                    fill="#0ea5e9"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
