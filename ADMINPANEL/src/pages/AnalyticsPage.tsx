import { DatePicker, Table, Typography, theme, Spin } from 'antd'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
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
import { PICKER_DATE_FORMAT } from '../lib/dateDisplay'
import { UI } from '../lib/labels'
import type { AccessTurnstileSummary } from '../types/analytics'

const { RangePicker } = DatePicker

export function AnalyticsPage() {
  const { mode } = useTheme()
  const { token } = theme.useToken()
  const isDark = mode === 'dark'
  const { bootstrapped, isAuthenticated } = useAuth()
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>(() => {
    const t = dayjs()
    return [t.subtract(6, 'day'), t]
  })
  const [from, to] = useMemo(
    () => [range[0].format('YYYY-MM-DD'), range[1].format('YYYY-MM-DD')] as const,
    [range],
  )

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

  const { data: turnstile, isLoading: l4 } = useQuery({
    queryKey: ['access-turnstile', from, to],
    queryFn: () =>
      apiFetch<AccessTurnstileSummary>(
        `/api/analytics/access-turnstile?from=${from}&to=${to}`,
      ),
    enabled: bootstrapped && isAuthenticated,
  })

  const loading = l1 || l2 || l3 || l4

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
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Typography.Title level={3} className="!mb-1 !font-semibold">
            {UI.analyticsTitle}
          </Typography.Title>
          <Typography.Text type="secondary">{UI.analyticsDesc}</Typography.Text>
        </div>
        <div className="shrink-0">
          <Typography.Text type="secondary" className="mr-2 text-xs uppercase">
            {UI.dateFilter}
          </Typography.Text>
          <RangePicker
            value={range}
            format={[PICKER_DATE_FORMAT, PICKER_DATE_FORMAT]}
            onChange={(v) => {
              if (v?.[0] && v[1]) setRange([v[0], v[1]])
            }}
            allowClear={false}
          />
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/80">
          <Typography.Text type="secondary" className="text-xs uppercase">
            {UI.analyticsEntries}
          </Typography.Text>
          <div className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {turnstile?.entryCount ?? '—'}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/80">
          <Typography.Text type="secondary" className="text-xs uppercase">
            {UI.analyticsExits}
          </Typography.Text>
          <div className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {turnstile?.exitCount ?? '—'}
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-zinc-200/90 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/80">
        <Typography.Title level={5} className="!mb-4 !font-semibold">
          {UI.analyticsTurnstile}
        </Typography.Title>
        {l4 ? (
          <div className="flex justify-center py-8">
            <Spin />
          </div>
        ) : (
          <Table
            size="small"
            pagination={{ pageSize: 8 }}
            rowKey="employeeId"
            dataSource={turnstile?.byEmployee ?? []}
            columns={[
              { title: UI.colEmployee, dataIndex: 'fullName', ellipsis: true },
              { title: UI.analyticsEntries, dataIndex: 'entries', width: 100 },
              { title: UI.analyticsExits, dataIndex: 'exits', width: 100 },
            ]}
          />
        )}
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
