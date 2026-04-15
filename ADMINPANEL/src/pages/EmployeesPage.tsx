import { UserOutlined } from '@ant-design/icons'
import { Avatar, Progress, Spin, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { efficiencyColor } from '../lib/format'
import { useAuth } from '../contexts/AuthContext'
import { apiFetch } from '../lib/api'
import { UI } from '../lib/labels'
import type { EmployeeSummary } from '../types/activity'

type ApiEmployee = {
  id: string
  fullName: string
  avatarUrl?: string | null
  isActive: boolean
  position?: string
  departmentId?: string | null
  department?: { name: string } | null
}

function statusTag(s: EmployeeSummary['status']) {
  if (s === 'active') return <Tag color="success">{UI.statusActive}</Tag>
  if (s === 'away') return <Tag color="warning">{UI.statusAway}</Tag>
  return <Tag>{UI.statusOffline}</Tag>
}

export function EmployeesPage() {
  const { bootstrapped, isAuthenticated } = useAuth()

  const { data: employees = [], isLoading: le } = useQuery({
    queryKey: ['employees'],
    queryFn: () => apiFetch<ApiEmployee[]>('/api/employees'),
    enabled: bootstrapped && isAuthenticated,
  })

  const { data: eff = [], isLoading: lf } = useQuery({
    queryKey: ['efficiency-by-employee'],
    queryFn: () =>
      apiFetch<{ employeeId: string; avgEfficiency: number }[]>(
        '/api/analytics/efficiency-by-employee',
      ),
    enabled: bootstrapped && isAuthenticated,
  })

  const data = useMemo<EmployeeSummary[]>(() => {
    const m = new Map(eff.map((e) => [e.employeeId, e.avgEfficiency]))
    return employees.map((e) => ({
      id: e.id,
      name: e.fullName,
      avatar: e.avatarUrl ?? '',
      department: e.department?.name ?? '',
      departmentId: e.departmentId ?? null,
      position: e.position ?? '',
      status: e.isActive ? 'active' : 'offline',
      avgEfficiency: m.get(e.id) ?? 0,
      recordsCount: 0,
      lastActivityDate: null,
    }))
  }, [employees, eff])

  const columns: ColumnsType<EmployeeSummary> = [
    {
      title: UI.colEmployee,
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (_, r) => (
        <div className="flex items-center gap-3">
          <Avatar src={r.avatar} icon={<UserOutlined />} size={40} />
          <span className="font-medium">{r.name}</span>
        </div>
      ),
    },
    {
      title: UI.colDepartment,
      key: 'department',
      sorter: (a, b) => (a.department || '').localeCompare(b.department || ''),
      render: (_, r) =>
        r.departmentId ? (
          r.department
        ) : (
          <Tag color="orange">{UI.unassignedDept}</Tag>
        ),
    },
    {
      title: UI.colPosition,
      dataIndex: 'position',
      ellipsis: true,
    },
    {
      title: UI.colStatus,
      dataIndex: 'status',
      render: (v: EmployeeSummary['status']) => statusTag(v),
    },
    {
      title: UI.colEfficiency,
      dataIndex: 'avgEfficiency',
      sorter: (a, b) => a.avgEfficiency - b.avgEfficiency,
      render: (v: number) => (
        <div className="min-w-[140px]">
          <Progress
            percent={v}
            size="small"
            strokeColor={efficiencyColor(v)}
            format={(p) => `${p}%`}
          />
        </div>
      ),
    },
    {
      title: UI.colRecords,
      dataIndex: 'recordsCount',
      sorter: (a, b) => a.recordsCount - b.recordsCount,
    },
    {
      title: UI.colLastActivity,
      dataIndex: 'lastActivityDate',
      render: (v: string | null) => v ?? '—',
    },
  ]

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
          {UI.employeesPageTitle}
        </Typography.Title>
        <Typography.Text type="secondary">{UI.employeesPageDesc}</Typography.Text>
      </div>

      <Table<EmployeeSummary>
        rowKey="id"
        loading={le || lf}
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 12, showSizeChanger: true }}
        scroll={{ x: 900 }}
      />
    </>
  )
}
