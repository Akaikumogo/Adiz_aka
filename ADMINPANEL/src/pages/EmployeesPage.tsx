import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  App,
  Avatar,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Progress,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import type { Key } from 'react'
import { useMemo, useState } from 'react'
import { EmployeeDayDrawer } from '../components/employees/EmployeeDayDrawer'
import { efficiencyColor } from '../lib/format'
import { useAuth } from '../contexts/AuthContext'
import { apiFetch } from '../lib/api'
import { UI } from '../lib/labels'
import type { EmployeesActivitySummaryRow } from '../types/analytics'
import type { EmployeeSummary } from '../types/activity'

type ApiEmployee = {
  id: string
  fullName: string
  avatarUrl?: string | null
  isActive: boolean
  position?: string
  departmentId?: string | null
  department?: { name: string } | null
  roomId?: string | null
  room?: { name: string } | null
  cardId?: string | null
  workStart?: string
  workEnd?: string
}

type Dept = { id: string; name: string }
type Room = { id: string; name: string }
type PositionRow = { id: string; name: string }

function statusTag(s: EmployeeSummary['status']) {
  if (s === 'active') return <Tag color="success">{UI.statusActive}</Tag>
  if (s === 'away') return <Tag color="warning">{UI.statusAway}</Tag>
  return <Tag>{UI.statusOffline}</Tag>
}

export function EmployeesPage() {
  const { bootstrapped, isAuthenticated } = useAuth()
  const { message } = App.useApp()
  const qc = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedName, setSelectedName] = useState('')
  const [detailDate, setDetailDate] = useState(() => dayjs().format('YYYY-MM-DD'))

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ApiEmployee | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [form] = Form.useForm<{
    fullName: string
    departmentId?: string
    position?: string
    cardId?: string
    roomId?: string
    workStart?: string
    workEnd?: string
    isActive: boolean
  }>()

  const { data: employees = [], isLoading: le } = useQuery({
    queryKey: ['employees'],
    queryFn: () => apiFetch<ApiEmployee[]>('/api/employees'),
    enabled: bootstrapped && isAuthenticated,
  })

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiFetch<Dept[]>('/api/departments'),
    enabled: bootstrapped && isAuthenticated,
  })

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => apiFetch<Room[]>('/api/rooms'),
    enabled: bootstrapped && isAuthenticated,
  })

  const { data: positionList = [] } = useQuery({
    queryKey: ['positions'],
    queryFn: () => apiFetch<PositionRow[]>('/api/positions'),
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

  const { data: actSum = [], isLoading: la } = useQuery({
    queryKey: ['employees-activity-summary'],
    queryFn: () =>
      apiFetch<EmployeesActivitySummaryRow[]>('/api/analytics/employees/activity-summary'),
    enabled: bootstrapped && isAuthenticated,
  })

  const sumMap = useMemo(
    () => new Map(actSum.map((s) => [s.employeeId, s] as const)),
    [actSum],
  )

  const effMap = useMemo(() => new Map(eff.map((e) => [e.employeeId, e.avgEfficiency])), [eff])

  const data = useMemo<EmployeeSummary[]>(() => {
    return employees.map((e) => {
      const s = sumMap.get(e.id)
      return {
        id: e.id,
        name: e.fullName,
        avatar: e.avatarUrl ?? '',
        department: e.department?.name ?? '',
        departmentId: e.departmentId ?? null,
        position: e.position ?? '',
        status: e.isActive ? 'active' : 'offline',
        avgEfficiency: effMap.get(e.id) ?? 0,
        recordsCount: s?.recordsCount ?? 0,
        lastActivityDate: s?.lastActivityAt
          ? dayjs(s.lastActivityAt).format('YYYY-MM-DD HH:mm')
          : null,
      }
    })
  }, [employees, effMap, sumMap])

  const saveMut = useMutation({
    mutationFn: (v: {
      fullName: string
      departmentId?: string
      position?: string
      cardId?: string
      roomId?: string
      workStart?: string
      workEnd?: string
      isActive: boolean
    }) =>
      editing
        ? apiFetch(`/api/employees/${editing.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              fullName: v.fullName,
              departmentId: v.departmentId ?? null,
              position: v.position ?? '',
              cardId: v.cardId?.trim() || null,
              roomId: v.roomId ?? null,
              workStart: v.workStart,
              workEnd: v.workEnd,
              isActive: v.isActive,
            }),
          })
        : apiFetch('/api/employees', {
            method: 'POST',
            body: JSON.stringify({
              fullName: v.fullName,
              departmentId: v.departmentId ?? null,
              position: v.position ?? '',
              cardId: v.cardId?.trim() || null,
              roomId: v.roomId ?? null,
              workStart: v.workStart ?? '09:00',
              workEnd: v.workEnd ?? '18:00',
              isActive: v.isActive,
            }),
          }),
    onSuccess: () => {
      message.success(editing ? 'Saqlandi' : 'Qo‘shildi')
      setModalOpen(false)
      setEditing(null)
      form.resetFields()
      void qc.invalidateQueries({ queryKey: ['employees'] })
      void qc.invalidateQueries({ queryKey: ['efficiency-by-employee'] })
      void qc.invalidateQueries({ queryKey: ['employees-activity-summary'] })
    },
    onError: (e: Error) => message.error(e.message),
  })

  const delMut = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/employees/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      message.success('O‘chirildi')
      void qc.invalidateQueries({ queryKey: ['employees'] })
    },
    onError: (e: Error) => message.error(e.message),
  })

  const positionOptions = useMemo(
    () => positionList.map((p) => ({ value: p.name, label: p.name })),
    [positionList],
  )

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
    { title: UI.colPosition, dataIndex: 'position', ellipsis: true },
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
    {
      title: UI.colActions,
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, r) => {
        const emp = employees.find((e) => e.id === r.id)
        return (
          <Space
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              aria-label={UI.edit}
              onClick={(e) => {
                e.stopPropagation()
                if (!emp) return
                setEditing(emp)
                form.setFieldsValue({
                  fullName: emp.fullName,
                  departmentId: emp.departmentId ?? undefined,
                  position: emp.position ?? '',
                  cardId: emp.cardId ?? '',
                  roomId: emp.roomId ?? undefined,
                  workStart: emp.workStart ?? '09:00',
                  workEnd: emp.workEnd ?? '18:00',
                  isActive: emp.isActive ?? true,
                })
                setModalOpen(true)
              }}
            />
            <Popconfirm
              title={UI.confirmDelete}
              onConfirm={() => delMut.mutate(r.id)}
            >
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                aria-label="Delete"
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          </Space>
        )
      },
    },
  ]

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({
      fullName: '',
      isActive: true,
      workStart: '09:00',
      workEnd: '18:00',
    })
    setModalOpen(true)
  }

  const bulkDelete = () => {
    const ids = selectedRowKeys.map(String)
    if (ids.length === 0) return
    Modal.confirm({
      title: `${UI.bulkDelete} (${ids.length})?`,
      okType: 'danger',
      onOk: async () => {
        for (const id of ids) {
          await apiFetch(`/api/employees/${id}`, { method: 'DELETE' })
        }
        message.success('O‘chirildi')
        setSelectedRowKeys([])
        void qc.invalidateQueries({ queryKey: ['employees'] })
      },
    })
  }

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
            {UI.employeesPageTitle}
          </Typography.Title>
          <Typography.Text type="secondary">{UI.employeesPageDesc}</Typography.Text>
        </div>
        <Space wrap>
          {selectedRowKeys.length > 0 && (
            <Button danger onClick={bulkDelete}>
              {UI.bulkDelete} ({selectedRowKeys.length})
            </Button>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {UI.add}
          </Button>
        </Space>
      </div>

      <Table<EmployeeSummary>
        rowKey="id"
        loading={le || lf || la}
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 12, showSizeChanger: true }}
        scroll={{ x: 1100 }}
        className="wp-employees-table"
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        onRow={(record) => ({
          onClick: () => {
            setSelectedId(record.id)
            setSelectedName(record.name)
            setDetailDate(dayjs().format('YYYY-MM-DD'))
            setDrawerOpen(true)
          },
        })}
      />

      <Modal
        title={editing ? UI.edit : UI.add}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false)
          setEditing(null)
          form.resetFields()
        }}
        footer={null}
        destroyOnClose
        width={560}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(v) => saveMut.mutate({ ...v, isActive: v.isActive ?? true })}
        >
          <Form.Item name="fullName" label={UI.colEmployee} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="departmentId" label={UI.colDepartment}>
            <Select
              allowClear
              placeholder="—"
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
            />
          </Form.Item>
          <Form.Item name="position" label={UI.colPosition}>
            <Select
              showSearch
              allowClear
              placeholder="—"
              options={positionOptions}
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item name="roomId" label={UI.colRoomName}>
            <Select
              allowClear
              placeholder="—"
              options={rooms.map((r) => ({ value: r.id, label: r.name }))}
            />
          </Form.Item>
          <Form.Item name="cardId" label={UI.cardIdLabel}>
            <Input className="font-mono" placeholder="Karta ID" />
          </Form.Item>
          <Form.Item name="workStart" label={UI.workStart}>
            <Input placeholder="09:00" />
          </Form.Item>
          <Form.Item name="workEnd" label={UI.workEnd}>
            <Input placeholder="18:00" />
          </Form.Item>
          <Form.Item name="isActive" label={UI.colStatus} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saveMut.isPending} block>
            {UI.save}
          </Button>
        </Form>
      </Modal>

      <EmployeeDayDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        employeeId={selectedId}
        employeeName={selectedName}
        date={detailDate}
        onDateChange={setDetailDate}
      />
    </>
  )
}
