import { CalendarOutlined, SearchOutlined } from '@ant-design/icons'
import { DatePicker, Input, Spin, Typography } from 'antd'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'
import { useCallback, useMemo, useState } from 'react'
import { ActivityTable } from '../components/ActivityTable'
import { DetailDrawer } from '../components/DetailDrawer'
import { SummaryCards } from '../components/SummaryCards'
import { useAuth } from '../contexts/AuthContext'
import { useRealtime } from '../hooks/useRealtime'
import { apiFetch } from '../lib/api'
import { UI } from '../lib/labels'
import type { DailyRecord, Employee } from '../types/activity'

type ApiEmployee = {
  id: string
  fullName: string
  avatarUrl?: string | null
  isActive: boolean
  position?: string
  department?: { name: string } | null
}

function mapEmployee(e: ApiEmployee): Employee {
  return {
    id: e.id,
    name: e.fullName,
    avatar: e.avatarUrl ?? '',
    department: e.department?.name ?? '—',
    position: e.position ?? '',
    status: e.isActive ? 'active' : 'offline',
  }
}

type ApiDailyRow = {
  id: string
  employeeId: string
  employeeName?: string | null
  date: string
  officeIn: string
  roomIn: string
  officeOut: string
  activeTime: number
  idleTime: number
  lunchTime: number
  efficiency: number
  timelineEvents?: DailyRecord['timelineEvents']
  segments?: DailyRecord['segments']
}

export function DashboardPage() {
  const { bootstrapped, isAuthenticated } = useAuth()
  const qc = useQueryClient()
  const [range, setRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(6, 'day'),
    dayjs(),
  ])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<DailyRecord | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const from = range[0].format('YYYY-MM-DD')
  const to = range[1].format('YYYY-MM-DD')

  const { data: employeesRaw = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => apiFetch<ApiEmployee[]>('/api/employees'),
    enabled: bootstrapped && isAuthenticated,
  })

  const employees = useMemo(() => {
    const list = employeesRaw.map(mapEmployee)
    return new Map(list.map((e) => [e.id, e]))
  }, [employeesRaw])

  const { data: kpis } = useQuery({
    queryKey: ['kpis', from, to],
    queryFn: () =>
      apiFetch<{
        totalEmployees: number
        activeToday: number
        avgEfficiency: number
        totalActiveMinutes: number
        totalIdleMinutes: number
      }>(`/api/analytics/kpis?from=${from}&to=${to}`),
    enabled: bootstrapped && isAuthenticated,
  })

  const { data: rowsRaw = [], isLoading } = useQuery({
    queryKey: ['daily-records', from, to, search],
    queryFn: () => {
      const q = search.trim()
        ? `&search=${encodeURIComponent(search.trim())}`
        : ''
      return apiFetch<ApiDailyRow[]>(
        `/api/analytics/daily-records?from=${from}&to=${to}${q}`,
      )
    },
    enabled: bootstrapped && isAuthenticated,
  })

  const rows = useMemo<DailyRecord[]>(() => {
    return rowsRaw.map((r) => ({
      id: r.id,
      employeeId: r.employeeId,
      employeeName: r.employeeName,
      date: r.date,
      officeIn: r.officeIn,
      roomIn: r.roomIn,
      officeOut: r.officeOut,
      activeTime: r.activeTime,
      idleTime: r.idleTime,
      lunchTime: r.lunchTime,
      efficiency: r.efficiency,
      timelineEvents: r.timelineEvents ?? [],
      segments: r.segments ?? [],
    }))
  }, [rowsRaw])

  const onRefresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['kpis'] })
    void qc.invalidateQueries({ queryKey: ['daily-records'] })
    void qc.invalidateQueries({ queryKey: ['employees'] })
  }, [qc])

  useRealtime(onRefresh)

  const getEmployeeById = useCallback(
    (id: string) => employees.get(id),
    [employees],
  )

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
            {UI.appTitle}
          </Typography.Title>
          <Typography.Text type="secondary" className="text-sm">
            {UI.dashboard} — {UI.dateFilter.toLowerCase()} va qidiruv
          </Typography.Text>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <DatePicker.RangePicker
            value={range}
            onChange={(v) => v && v[0] && v[1] && setRange([v[0], v[1]])}
            suffixIcon={<CalendarOutlined />}
            allowClear={false}
            className="w-full sm:w-auto"
          />
          <Input
            allowClear
            placeholder={UI.searchPlaceholder}
            prefix={<SearchOutlined className="text-zinc-400" />}
            className="w-full sm:w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <Typography.Text className="mb-4 block text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {UI.summary}
          </Typography.Text>
          <SummaryCards
            totalEmployees={kpis?.totalEmployees ?? 0}
            activeToday={kpis?.activeToday ?? 0}
            avgEfficiency={kpis?.avgEfficiency ?? 0}
            totalActiveMinutes={kpis?.totalActiveMinutes ?? 0}
            totalIdleMinutes={kpis?.totalIdleMinutes ?? 0}
          />
        </section>

        <section className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
          <Typography.Title level={5} className="!mb-6 !font-semibold">
            {UI.tableTitle}
          </Typography.Title>
          <ActivityTable
            rows={rows}
            employees={employees}
            loading={isLoading}
            onRowClick={(r) => {
              setSelected(r)
              setDrawerOpen(true)
            }}
          />
        </section>
      </div>

      <DetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        record={selected}
        employee={selected ? getEmployeeById(selected.employeeId) : undefined}
      />
    </>
  )
}
