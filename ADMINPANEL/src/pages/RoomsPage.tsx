import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Form, Input, Modal, Popconfirm, Space, Spin, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiFetch } from '../lib/api'
import { UI } from '../lib/labels'

type Row = {
  id: string
  name: string
  code: string | null
  description: string | null
  createdAt: string
}

export function RoomsPage() {
  const { bootstrapped, isAuthenticated } = useAuth()
  const { message } = App.useApp()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [form] = Form.useForm<{ name: string; code?: string; description?: string }>()

  const { data = [], isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => apiFetch<Row[]>('/api/rooms'),
    enabled: bootstrapped && isAuthenticated,
  })

  const saveMut = useMutation({
    mutationFn: (v: { name: string; code?: string; description?: string }) =>
      editing
        ? apiFetch(`/api/rooms/${editing.id}`, {
            method: 'PATCH',
            body: JSON.stringify(v),
          })
        : apiFetch('/api/rooms', { method: 'POST', body: JSON.stringify(v) }),
    onSuccess: () => {
      message.success(editing ? 'Yangilandi' : 'Qo‘shildi')
      setOpen(false)
      setEditing(null)
      form.resetFields()
      void qc.invalidateQueries({ queryKey: ['rooms'] })
    },
    onError: (e: Error) => message.error(e.message),
  })

  const delMut = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/rooms/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      message.success('O‘chirildi')
      void qc.invalidateQueries({ queryKey: ['rooms'] })
    },
    onError: (e: Error) => message.error(e.message),
  })

  const columns: ColumnsType<Row> = [
    { title: UI.colRoomName, dataIndex: 'name' },
    { title: UI.colCode, dataIndex: 'code', render: (v) => v ?? '—' },
    {
      title: UI.colDescription,
      dataIndex: 'description',
      ellipsis: true,
      render: (v) => v ?? '—',
    },
    {
      title: UI.colActions,
      key: 'a',
      render: (_, r) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditing(r)
              form.setFieldsValue({
                name: r.name,
                code: r.code ?? undefined,
                description: r.description ?? undefined,
              })
              setOpen(true)
            }}
          />
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
            {UI.navRooms}
          </Typography.Title>
          <Typography.Text type="secondary">{UI.roomsPageDesc}</Typography.Text>
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
      <Table<Row> rowKey="id" loading={isLoading} columns={columns} dataSource={data} pagination={{ pageSize: 12 }} />
      <Modal
        title={editing ? UI.edit : UI.add}
        open={open}
        onCancel={() => {
          setOpen(false)
          setEditing(null)
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={(v) => saveMut.mutate(v)}>
          <Form.Item name="name" label={UI.colRoomName} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label={UI.colCode}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label={UI.colDescription}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saveMut.isPending} block>
            {UI.save}
          </Button>
        </Form>
      </Modal>
    </>
  )
}
