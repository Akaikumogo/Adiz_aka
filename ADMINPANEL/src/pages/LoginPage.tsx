import { LockOutlined, MoonOutlined, SafetyCertificateOutlined, SunOutlined, UserOutlined } from '@ant-design/icons'
import { App, Button, Card, Form, Input, Spin, Switch, Typography } from 'antd'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { UI } from '../lib/labels'

export function LoginPage() {
  const { login, isAuthenticated, bootstrapped } = useAuth()
  const { mode, toggle } = useTheme()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const isDark = mode === 'dark'

  useEffect(() => {
    if (!bootstrapped) return
    if (isAuthenticated) navigate({ to: '/' })
  }, [bootstrapped, isAuthenticated, navigate])

  if (!bootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 dark:bg-zinc-950">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-zinc-100 dark:bg-zinc-950">
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2 md:right-8 md:top-6">
        <span className="hidden text-xs text-zinc-500 sm:inline dark:text-zinc-400">{UI.themeLabel}</span>
        <Switch
          checked={isDark}
          onChange={() => toggle()}
          checkedChildren={<MoonOutlined />}
          unCheckedChildren={<SunOutlined />}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-zinc-200/40 dark:bg-zinc-900/50" />
      <div className="relative z-[1] hidden w-1/2 flex-col justify-between border-r border-zinc-200/80 bg-white/70 p-12 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/50 lg:flex">
        <div>
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-lg font-bold text-white dark:bg-blue-600">
              W
            </div>
            <div>
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {UI.brand}
              </div>
              <div className="text-sm text-zinc-500">{UI.brandTagline}</div>
            </div>
          </div>
          <Typography.Title level={2} className="!mb-4 !max-w-md !font-semibold !leading-snug !text-zinc-900 dark:!text-white">
            Korxonangiz uchun real vaqt monitoring
          </Typography.Title>
          <Typography.Paragraph className="!mb-0 !max-w-md !text-base !text-zinc-600 dark:!text-zinc-400">
            Faollik, samaradorlik va ish vaqtini markazlashtirilgan panelda kuzating — xavfsiz, tez va tushunarli.
          </Typography.Paragraph>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <SafetyCertificateOutlined className="text-emerald-500" />
          HTTPS va JWT bilan himoyalangan kirish
        </div>
      </div>

      <div className="relative z-[1] flex w-full flex-1 items-center justify-center p-6 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md"
        >
          <Card
            className="border-zinc-200/90 shadow-xl shadow-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900/90 dark:shadow-none"
            styles={{ body: { padding: '2rem 2rem 1.75rem' } }}
          >
            <div className="mb-8 text-center lg:text-left">
              <Typography.Title level={3} className="!mb-2 !font-semibold">
                {UI.login}
              </Typography.Title>
              <Typography.Text type="secondary">{UI.loginSubtitle}</Typography.Text>
            </div>
            <Form
              layout="vertical"
              requiredMark={false}
              onFinish={async (v: { email: string; password: string }) => {
                setLoading(true)
                try {
                  await login(v.email, v.password)
                  navigate({ to: '/' })
                } catch (e) {
                  message.error((e as Error).message)
                } finally {
                  setLoading(false)
                }
              }}
            >
              <Form.Item
                name="email"
                label={UI.loginField}
                rules={[{ required: true, type: 'email', message: 'Email kiriting' }]}
              >
                <Input
                  size="large"
                  autoComplete="username"
                  prefix={<UserOutlined className="text-zinc-400" />}
                  placeholder="name@korxona.uz"
                />
              </Form.Item>
              <Form.Item
                name="password"
                label={UI.password}
                rules={[{ required: true, message: 'Parolni kiriting' }]}
              >
                <Input.Password
                  size="large"
                  autoComplete="current-password"
                  prefix={<LockOutlined className="text-zinc-400" />}
                  placeholder="••••••••"
                />
              </Form.Item>
              <Form.Item className="!mb-0 !mt-6">
                <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                  {UI.signIn}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
