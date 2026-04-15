import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Form, Input, Modal, Popconfirm, Space, Spin, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiFetch } from '../lib/api'
import { UI } from '../lib/labels'

type Row = { id: string; name: string; code: string | null; createdAt: string }

export function DepartmentsPage() {
  const { bootstrapped, isAuthenticated } = useAuth()
  const { message } = App.useApp()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [form] = Form.useForm<{ name: string; code?: string }>()

  const { data = [], isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiFetch<Row[]>('/api/departments'),
    enabled: bootstrapped && isAuthenticated,
  })

  const saveMut = useMutation({
    mutationFn: (v: { name: string; code?: string }) =>
      editing
        ? apiFetch(`/api/departments/${editing.id}`, {
            method: 'PATCH',
            body: JSON.stringify(v),
          })
        : apiFetch('/api/departments', { method: 'POST', body: JSON.stringify(v) }),
    onSuccess: () => {
      message.success(editing ? 'Yangilandi' : 'Qo‘shildi')
      setOpen(false)
      setEditing(null)
      form.resetFields()
      void qc.invalidateQueries({ queryKey: ['departments'] })
    },
    onError: (e: Error) => message.error(e.message),
  })

  const delMut = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/departments/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      message.success('O‘chirildi')
      void qc.invalidateQueries({ queryKey: ['departments'] })
    },
    onError: (e: Error) => message.error(e.message),
  })

  const columns: ColumnsType<Row> = [
    { title: UI.colNameDept, dataIndex: 'name' },
    { title: UI.colCode, dataIndex: 'code', render: (v) => v ?? '—' },
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
              form.setFieldsValue({ name: r.name, code: r.code ?? undefined })
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
            {UI.navDepartments}
          </Typography.Title>
          <Typography.Text type="secondary">{UI.deptPageDesc}</Typography.Text>
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
          <Form.Item name="name" label={UI.colNameDept} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label={UI.colCode}>
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saveMut.isPending} block>
            {UI.save}
          </Button>
        </Form>
      </Modal>
    </>
  )
}
