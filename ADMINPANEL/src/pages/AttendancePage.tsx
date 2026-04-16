import { CalendarOutlined } from '@ant-design/icons'
import { DatePicker, Spin, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiFetch } from '../lib/api'
import { PICKER_DATE_FORMAT } from '../lib/dateDisplay'
import { UI } from '../lib/labels'

type AttendanceRow = {
  employeeId: string
  fullName: string
  departmentName: string | null
  position: string
  present: boolean
  firstEntryAt: string | null
  lastExitAt: string | null
}

export function AttendancePage() {
  const { bootstrapped, isAuthenticated } = useAuth()
  const [date, setDate] = useState(() => dayjs())
  const dateStr = date.format('YYYY-MM-DD')

  const { data = [], isLoading } = useQuery({
    queryKey: ['attendance', dateStr],
    queryFn: () =>
      apiFetch<AttendanceRow[]>(`/api/analytics/attendance?date=${encodeURIComponent(dateStr)}`),
    enabled: bootstrapped && isAuthenticated,
  })

  const columns: ColumnsType<AttendanceRow> = useMemo(
    () => [
      {
        title: UI.colEmployee,
        dataIndex: 'fullName',
        sorter: (a, b) => a.fullName.localeCompare(b.fullName),
      },
      {
        title: UI.colDepartment,
        dataIndex: 'departmentName',
        render: (v: string | null) => v ?? '—',
      },
      { title: UI.colPosition, dataIndex: 'position', ellipsis: true },
      {
        title: UI.colPresent,
        dataIndex: 'present',
        render: (v: boolean) =>
          v ? <Tag color="success">Ha</Tag> : <Tag>Yo‘q</Tag>,
      },
      {
        title: UI.colFirstEntry,
        dataIndex: 'firstEntryAt',
        render: (v: string | null) =>
          v ? dayjs(v).format('DD.MM.YYYY HH:mm') : '—',
      },
      {
        title: UI.colLastExit,
        dataIndex: 'lastExitAt',
        render: (v: string | null) =>
          v ? dayjs(v).format('DD.MM.YYYY HH:mm') : '—',
      },
    ],
    [],
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
            {UI.attendanceTitle}
          </Typography.Title>
          <Typography.Text type="secondary">{UI.attendanceDesc}</Typography.Text>
        </div>
        <div className="flex items-center gap-2">
          <Typography.Text type="secondary" className="text-xs uppercase">
            {UI.pickDate}
          </Typography.Text>
          <DatePicker
            value={date}
            onChange={(d) => d && setDate(d)}
            format={PICKER_DATE_FORMAT}
            allowClear={false}
            suffixIcon={<CalendarOutlined />}
            disabledDate={(d) => d.isAfter(dayjs(), 'day')}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200/90 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900/80">
        <Table<AttendanceRow>
          rowKey="employeeId"
          loading={isLoading}
          columns={columns}
          dataSource={data}
          pagination={{ pageSize: 15, showSizeChanger: true }}
          scroll={{ x: 960 }}
        />
      </div>
    </>
  )
}
