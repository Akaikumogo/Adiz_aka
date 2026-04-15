import { PlusOutlined } from '@ant-design/icons'
import {
  App,
  Button,
  Form,
  Input,
  Modal,
  Result,
  Spin,
  Switch,
  Table,
  Typography,
} from 'antd'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiFetch } from '../lib/api'
import { UI } from '../lib/labels'

type AdminRow = {
  id: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
}

export function AdminsPage() {
  const { user, bootstrapped } = useAuth()
  const { message } = App.useApp()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm<{ email: string; password: string }>()
  const isSa = user?.role === 'superadmin'

  const { data = [], isLoading } = useQuery({
    queryKey: ['admins'],
    queryFn: () => apiFetch<AdminRow[]>('/api/users/admins'),
    enabled: bootstrapped && isSa,
  })

  const createMut = useMutation({
    mutationFn: (v: { email: string; password: string }) =>
      apiFetch('/api/users/admins', {
        method: 'POST',
        body: JSON.stringify(v),
      }),
    onSuccess: () => {
      message.success('Administrator yaratildi')
      setOpen(false)
      form.resetFields()
      void qc.invalidateQueries({ queryKey: ['admins'] })
    },
    onError: (e: Error) => message.error(e.message),
  })

  const patchMut = useMutation({
    mutationFn: (p: { id: string; isActive: boolean }) =>
      apiFetch(`/api/users/admins/${p.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: p.isActive }),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admins'] }),
    onError: (e: Error) => message.error(e.message),
  })

  if (!bootstrapped) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (!isSa) {
    return (
      <Result
        status="403"
        title="Ruxsat yo‘q"
        subTitle="Administratorlar ro‘yxati faqat SuperAdmin uchun."
      />
    )
  }

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Typography.Title level={3} className="!mb-1 !font-semibold">
            {UI.navAdmins}
          </Typography.Title>
          <Typography.Text type="secondary">
            Yangi administrator yaratish va holatini boshqarish
          </Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Administrator qo‘shish
        </Button>
      </div>

      <Table<AdminRow>
        rowKey="id"
        loading={isLoading}
        dataSource={data}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: 'Email', dataIndex: 'email' },
          { title: 'Rol', dataIndex: 'role' },
          {
            title: 'Faol',
            dataIndex: 'isActive',
            render: (v: boolean, row) => (
              <Switch
                checked={v}
                loading={patchMut.isPending}
                onChange={(checked) =>
                  patchMut.mutate({ id: row.id, isActive: checked })
                }
              />
            ),
          },
          {
            title: 'Yaratilgan',
            dataIndex: 'createdAt',
            render: (v: string) => new Date(v).toLocaleString(),
          },
        ]}
      />

      <Modal
        title="Yangi administrator"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(v) => createMut.mutate(v)}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, type: 'email', message: 'Email kiriting' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label="Parol"
            rules={[{ required: true, min: 8, message: 'Kamida 8 belgi' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item className="!mb-0">
            <Button type="primary" htmlType="submit" loading={createMut.isPending} block>
              Yaratish
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
