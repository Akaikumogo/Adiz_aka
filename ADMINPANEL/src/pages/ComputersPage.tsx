import { CalendarOutlined, DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, SyncOutlined } from '@ant-design/icons'
import {
  App,
  Button,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiFetch } from '../lib/api'
import { PICKER_DATE_FORMAT } from '../lib/dateDisplay'
import { UI } from '../lib/labels'
import type { ComputerDayReport } from '../types/analytics'

type Emp = { id: string; fullName: string }
type Room = { id: string; name: string }
type ComputerRow = {
  id: string
  macAddress: string
  name: string
  employeeId: string | null
  roomId: string | null
  lastSeenAt: string | null
  employee?: Emp | null
  room?: Room | null
}

export function ComputersPage() {
  const { bootstrapped, isAuthenticated } = useAuth()
  const { message } = App.useApp()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<ComputerRow | null>(null)
  const [detailDate, setDetailDate] = useState(() => dayjs())
  const [editing, setEditing] = useState<ComputerRow | null>(null)
  const [form] = Form.useForm<{
    macAddress?: string
    name: string
    employeeId?: string
    roomId?: string
  }>()

  const { data = [], isLoading } = useQuery({
    queryKey: ['computers'],
    queryFn: () => apiFetch<ComputerRow[]>('/api/computers'),
    enabled: bootstrapped && isAuthenticated,
  })

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => apiFetch<Emp[]>('/api/employees'),
    enabled: bootstrapped && isAuthenticated,
  })

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => apiFetch<Room[]>('/api/rooms'),
    enabled: bootstrapped && isAuthenticated,
  })

  const saveMut = useMutation({
    mutationFn: (v: {
      macAddress?: string
      name: string
      employeeId?: string
      roomId?: string
    }) =>
      editing
        ? apiFetch(`/api/computers/${editing.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              name: v.name,
              employeeId: v.employeeId ?? null,
              roomId: v.roomId ?? null,
            }),
          })
        : apiFetch<{
            id: string
            machineToken: string
            warning?: string
          }>('/api/computers', {
            method: 'POST',
            body: JSON.stringify({
              macAddress: v.macAddress,
              name: v.name,
              employeeId: v.employeeId ?? undefined,
              roomId: v.roomId ?? undefined,
            }),
          }),
    onSuccess: (res) => {
      if (!editing && res && typeof res === 'object' && 'machineToken' in res) {
        const r = res as { machineToken: string; warning?: string }
        Modal.success({
          title: UI.machineToken,
          width: 520,
          content: (
            <div className="space-y-2">
              {r.warning && <Typography.Text type="warning">{r.warning}</Typography.Text>}
              <Input.TextArea readOnly rows={3} value={r.machineToken} className="font-mono text-xs" />
            </div>
          ),
        })
      } else if (editing) {
        message.success('Yangilandi')
      }
      setOpen(false)
      setEditing(null)
      form.resetFields()
      void qc.invalidateQueries({ queryKey: ['computers'] })
    },
    onError: (e: Error) => message.error(e.message),
  })

  const delMut = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/computers/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      message.success('O‘chirildi')
      void qc.invalidateQueries({ queryKey: ['computers'] })
    },
    onError: (e: Error) => message.error(e.message),
  })

  const detailDateStr = detailDate.format('YYYY-MM-DD')

  const { data: dayReport, isLoading: dayLoading } = useQuery({
    queryKey: ['computer-day', detail?.id, detailDateStr],
    queryFn: () =>
      apiFetch<ComputerDayReport>(
        `/api/analytics/computers/${detail!.id}/day?date=${encodeURIComponent(detailDateStr)}`,
      ),
    enabled: bootstrapped && isAuthenticated && !!detail?.id,
  })

  const rotateMut = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ machineToken: string; warning?: string }>(`/api/computers/${id}/rotate-token`, {
        method: 'POST',
      }),
    onSuccess: (res) => {
      Modal.success({
        title: UI.machineToken,
        content: (
          <div className="space-y-2">
            {res.warning && <Typography.Text type="warning">{res.warning}</Typography.Text>}
            <Input.TextArea readOnly rows={3} value={res.machineToken} className="font-mono text-xs" />
          </div>
        ),
      })
    },
    onError: (e: Error) => message.error(e.message),
  })

  const columns: ColumnsType<ComputerRow> = [
    { title: UI.colMac, dataIndex: 'macAddress', render: (v: string) => <span className="font-mono text-xs">{v}</span> },
    { title: UI.colComputerName, dataIndex: 'name' },
    {
      title: UI.colEmployee,
      key: 'emp',
      render: (_, r) => r.employee?.fullName ?? '—',
    },
    {
      title: UI.colRoomName,
      key: 'room',
      render: (_, r) => r.room?.name ?? '—',
    },
    {
      title: UI.colLastSeen,
      dataIndex: 'lastSeenAt',
      render: (v: string | null) => (v ? new Date(v).toLocaleString() : '—'),
    },
    {
      title: UI.colActions,
      key: 'a',
      width: 260,
      render: (_, r) => (
        <Space wrap>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setDetail(r)
              setDetailDate(dayjs())
            }}
          >
            Batafsil
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditing(r)
              form.setFieldsValue({
                name: r.name,
                employeeId: r.employeeId ?? undefined,
                roomId: r.roomId ?? undefined,
              })
              setOpen(true)
            }}
          />
          <Button
            type="link"
            size="small"
            icon={<SyncOutlined />}
            onClick={() => rotateMut.mutate(r.id)}
          >
            {UI.rotateToken}
          </Button>
          <Popconfirm title={UI.confirmDelete} onConfirm={() => delMut.mutate(r.id)}>
            <Button type="link" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  if (!bootstrapped) {
    return (
      <div className="flex min-h-[40vh] justify-center">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Typography.Title level={3} className="!mb-1 !font-semibold">
            {UI.navComputers}
          </Typography.Title>
          <Typography.Text type="secondary">{UI.computersPageDesc}</Typography.Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null)
            form.resetFields()
            setOpen(true)
          }}
        >
          {UI.add}
        </Button>
      </div>
      <Table<ComputerRow>
        rowKey="id"
        loading={isLoading}
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 12 }}
        scroll={{ x: 900 }}
      />
      <Modal
        title={editing ? UI.edit : UI.add}
        open={open}
        onCancel={() => {
          setOpen(false)
          setEditing(null)
        }}
        footer={null}
        destroyOnClose
        width={520}
      >
        <Form form={form} layout="vertical" onFinish={(v) => saveMut.mutate(v)}>
          {!editing && (
            <Form.Item name="macAddress" label={UI.colMac} rules={[{ required: true }]}>
              <Input placeholder="AA:BB:CC:DD:EE:FF" className="font-mono" />
            </Form.Item>
          )}
          <Form.Item name="name" label={UI.colComputerName} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="employeeId" label={UI.optionalEmployee}>
            <Select
              allowClear
              placeholder="—"
              options={employees.map((e) => ({ value: e.id, label: e.fullName }))}
            />
          </Form.Item>
          <Form.Item name="roomId" label={UI.optionalRoom}>
            <Select allowClear placeholder="—" options={rooms.map((r) => ({ value: r.id, label: r.name }))} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saveMut.isPending} block>
            {UI.save}
          </Button>
        </Form>
      </Modal>

      <Drawer
        title={UI.computerDetailTitle}
        width={560}
        open={!!detail}
        onClose={() => setDetail(null)}
        destroyOnClose
        extra={
          <DatePicker
            value={detailDate}
            onChange={(d) => d && setDetailDate(d)}
            format={PICKER_DATE_FORMAT}
            allowClear={false}
            suffixIcon={<CalendarOutlined />}
            disabledDate={(d) => d.isAfter(dayjs(), 'day')}
          />
        }
      >
        {detail && (
          <div className="space-y-6">
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label={UI.colComputerName}>{detail.name}</Descriptions.Item>
              <Descriptions.Item label={UI.colMac}>
                <span className="font-mono text-xs">{detail.macAddress}</span>
              </Descriptions.Item>
              <Descriptions.Item label={UI.colEmployee}>
                {detail.employee?.fullName ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label={UI.colRoomName}>{detail.room?.name ?? '—'}</Descriptions.Item>
              <Descriptions.Item label={UI.colLastSeen}>
                {detail.lastSeenAt ? new Date(detail.lastSeenAt).toLocaleString() : '—'}
              </Descriptions.Item>
            </Descriptions>

            {dayLoading ? (
              <div className="flex justify-center py-8">
                <Spin />
              </div>
            ) : dayReport ? (
              <>
                <div>
                  <Typography.Text type="secondary" className="text-xs uppercase">
                    {detailDateStr}
                  </Typography.Text>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <Tag>Jami hodisalar: {dayReport.totalEvents}</Tag>
                    <Tag color="success">working: {dayReport.byStatus.working}</Tag>
                    <Tag color="warning">idle: {dayReport.byStatus.idle}</Tag>
                    <Tag>break: {dayReport.byStatus.break}</Tag>
                  </div>
                </div>
                <div>
                  <Typography.Title level={5} className="!mb-2 !text-base !font-semibold">
                    {UI.activitySamples}
                  </Typography.Title>
                  <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-zinc-200/90 p-2 font-mono text-xs dark:border-zinc-700">
                    {dayReport.samples.length === 0 ? (
                      <Typography.Text type="secondary">{UI.noData}</Typography.Text>
                    ) : (
                      dayReport.samples.map((s, i) => (
                        <div key={`${s.at}-${i}`} className="flex justify-between gap-2">
                          <span>{new Date(s.at).toLocaleTimeString()}</span>
                          <span>{s.status}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}
      </Drawer>
    </>
  )
}
