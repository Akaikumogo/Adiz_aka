import {
  ApartmentOutlined,
  BarChartOutlined,
  BellOutlined,
  DashboardOutlined,
  HomeOutlined,
  LaptopOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
  SolutionOutlined,
  SunOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import {
  Avatar,
  Badge,
  Button,
  Drawer,
  Dropdown,
  Grid,
  Layout,
  Space,
  Spin,
  Switch,
  Typography,
  theme,
} from 'antd'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { UI } from '../../lib/labels'

const { Header, Sider, Content } = Layout

const LS_KEY = 'workpulse-sidebar'

function pageTitle(path: string): string {
  if (path.startsWith('/bolimlar')) return UI.navDepartments
  if (path.startsWith('/xonalar')) return UI.navRooms
  if (path.startsWith('/lavozimlar')) return UI.navPositions
  if (path.startsWith('/kompyuterlar')) return UI.navComputers
  if (path.startsWith('/adminlar')) return UI.navAdmins
  if (path.startsWith('/xodimlar')) return UI.navEmployees
  if (path.startsWith('/yoqlama')) return UI.navAttendance
  if (path.startsWith('/analitika')) return UI.navAnalytics
  return UI.navActivity
}

type NavDef = { path: string; icon: ReactNode; label: string }

function pathIsActive(path: string, pathname: string): boolean {
  if (path === '/') return pathname === '/'
  return pathname === path || pathname.startsWith(`${path}/`)
}

export function AppShellLayout() {
  const navigate = useNavigate()
  const screens = Grid.useBreakpoint()
  const isMobile = !screens.md
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const { user, logout, isAuthenticated, bootstrapped } = useAuth()
  const { mode, toggle } = useTheme()
  const isDark = mode === 'dark'
  const { token } = theme.useToken()

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(LS_KEY) === '1'
  })
  const [mobileOpen, setMobileOpen] = useState(false)

  const indicatorRef = useRef<HTMLDivElement>(null)
  const navContainerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (!bootstrapped) return
    if (!isAuthenticated) navigate({ to: '/login' })
  }, [bootstrapped, isAuthenticated, navigate])

  useEffect(() => {
    localStorage.setItem(LS_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  const title = useMemo(() => pageTitle(pathname), [pathname])
  const desktopCollapsed = !isMobile && collapsed

  const navItems: NavDef[] = useMemo(() => {
    const items: NavDef[] = [
      { path: '/', icon: <DashboardOutlined />, label: UI.navActivity },
    ]
    if (user?.role === 'superadmin') {
      items.push({
        path: '/adminlar',
        icon: <SafetyCertificateOutlined />,
        label: UI.navAdmins,
      })
    }
    items.push(
      { path: '/bolimlar', icon: <ApartmentOutlined />, label: UI.navDepartments },
      { path: '/xonalar', icon: <HomeOutlined />, label: UI.navRooms },
      { path: '/lavozimlar', icon: <SolutionOutlined />, label: UI.navPositions },
      { path: '/kompyuterlar', icon: <LaptopOutlined />, label: UI.navComputers },
      { path: '/xodimlar', icon: <TeamOutlined />, label: UI.navEmployees },
      { path: '/yoqlama', icon: <ScheduleOutlined />, label: UI.navAttendance },
      { path: '/analitika', icon: <BarChartOutlined />, label: UI.navAnalytics },
    )
    return items
  }, [user?.role])

  useEffect(() => {
    const activeIndex = navItems.findIndex((item) => pathIsActive(item.path, pathname))
    const activeEl = itemRefs.current[activeIndex]
    const containerEl = navContainerRef.current
    if (activeEl && containerEl && indicatorRef.current) {
      const activeRect = activeEl.getBoundingClientRect()
      const containerRect = containerEl.getBoundingClientRect()
      const offsetTop = activeRect.top - containerRect.top
      indicatorRef.current.style.top = `${offsetTop}px`
      indicatorRef.current.style.height = `${activeRect.height}px`
    }
  }, [pathname, navItems, collapsed, mobileOpen])

  if (!bootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDFCF9] dark:bg-zinc-950">
        <Spin size="large" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  const drawerStyles = isDark
    ? {
        body: { padding: 0, background: '#141414' },
        header: {
          background: '#141414',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          color: '#fff',
        },
      }
    : {
        body: { padding: 0, background: '#ffffff' },
        header: {
          background: '#ffffff',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          color: 'rgba(0,0,0,0.88)',
        },
      }

  const activeBg = token.colorPrimary
  const inactiveHover = isDark ? 'hover:bg-white/[0.06]' : 'hover:bg-zinc-100'

  const navList = (
    <nav
      className={`relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 ${
        desktopCollapsed ? 'px-2' : ''
      }`}
    >
      <div className="relative space-y-1" ref={navContainerRef}>
        <div
          ref={indicatorRef}
          className="absolute left-0 z-0 w-full rounded-xl transition-all duration-300 ease-out"
          style={{
            top: 0,
            height: 0,
            background: activeBg,
          }}
        />
        {navItems.map((item, index) => {
          const active = pathIsActive(item.path, pathname)
          return (
            <div
              key={item.path}
              className="relative z-10"
              ref={(el) => {
                itemRefs.current[index] = el
              }}
            >
              <Link to={item.path} onClick={() => isMobile && setMobileOpen(false)}>
                <div
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors duration-200 ${
                    desktopCollapsed ? 'justify-center px-2' : ''
                  } ${active ? 'text-white' : `text-zinc-600 dark:text-zinc-300 ${inactiveHover}`}`}
                >
                  <span className="flex shrink-0 text-lg">{item.icon}</span>
                  {!desktopCollapsed && (
                    <span className="font-medium whitespace-nowrap">{item.label}</span>
                  )}
                </div>
              </Link>
            </div>
          )
        })}
      </div>
    </nav>
  )

  const siderContent = (
    <>
      <div
        className={`flex h-16 shrink-0 items-center gap-3 border-b px-4 ${
          isDark ? 'border-white/10' : 'border-zinc-200'
        }`}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
          style={{ background: token.colorPrimary }}
        >
          W
        </div>
        {!desktopCollapsed && (
          <div className="min-w-0">
            <div
              className={`truncate text-base font-semibold leading-tight ${
                isDark ? 'text-white' : 'text-zinc-900'
              }`}
            >
              {UI.brand}
            </div>
            <div className={`truncate text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {UI.brandTagline}
            </div>
          </div>
        )}
      </div>
      {navList}
      <div
        className={`mt-auto shrink-0 border-t p-4 ${isDark ? 'border-white/10' : 'border-zinc-200'}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          {(!desktopCollapsed || isMobile) && (
            <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {UI.themeLabel}
            </span>
          )}
          <Switch
            checked={isDark}
            onChange={() => toggle()}
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<SunOutlined />}
          />
        </div>
        {!isMobile && (
          <Button
            type="text"
            block
            className={
              isDark
                ? 'mt-3 !text-zinc-400 hover:!bg-white/10 hover:!text-white'
                : 'mt-3 !text-zinc-600 hover:!bg-zinc-100 hover:!text-zinc-900'
            }
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((c) => !c)}
          >
            {!collapsed ? UI.collapseSidebar : null}
          </Button>
        )}
      </div>
    </>
  )

  return (
    <Layout className="min-h-screen bg-[#FDFCF9] dark:bg-zinc-950">
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={260}
          collapsedWidth={88}
          trigger={null}
          className={`app-sider border-r ${
            isDark
              ? 'border-zinc-800 !bg-[#141414]'
              : 'border-zinc-200/90 !bg-white shadow-[2px_0_12px_rgba(0,0,0,0.03)]'
          }`}
        >
          <div className="flex min-h-screen flex-col">{siderContent}</div>
        </Sider>
      )}
      {isMobile && (
        <Drawer
          rootClassName={
            isDark ? 'app-mobile-drawer app-mobile-drawer--dark' : 'app-mobile-drawer app-mobile-drawer--light'
          }
          title={
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              {UI.brand}
            </span>
          }
          placement="left"
          width={280}
          onClose={() => setMobileOpen(false)}
          open={mobileOpen}
          styles={drawerStyles}
        >
          <div className="flex min-h-[80vh] flex-col">{siderContent}</div>
        </Drawer>
      )}
      <Layout className="min-h-screen bg-transparent">
        <Header className="sticky top-0 z-20 flex h-auto flex-wrap items-center justify-between gap-4 border-b border-zinc-200/80 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 lg:px-8">
          <Space size="middle" align="center">
            {isMobile && (
              <Button
                type="text"
                className="text-zinc-700 dark:text-zinc-200"
                icon={mobileOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
                onClick={() => setMobileOpen((o) => !o)}
                aria-label="Menyu"
              />
            )}
            <div>
              <Typography.Title
                level={4}
                className="mb-0 text-lg text-zinc-900 md:text-xl dark:text-zinc-50"
              >
                {title}
              </Typography.Title>
              <Typography.Text type="secondary" className="text-xs md:text-sm">
                {user?.name} · {user?.role}
              </Typography.Text>
            </div>
          </Space>
          <Space size="middle">
            <Badge dot>
              <Button
                type="text"
                className="text-zinc-700 dark:text-zinc-200"
                icon={<BellOutlined className="text-lg" />}
                aria-label={UI.notifications}
              />
            </Badge>
            <Dropdown
              menu={{
                items: [
                  { key: 'out', icon: <LogoutOutlined />, label: UI.signOut, danger: true },
                ],
                onClick: ({ key }) => {
                  if (key === 'out') {
                    logout()
                    navigate({ to: '/login' })
                  }
                },
              }}
              trigger={['click']}
            >
              <Button
                type="text"
                className="flex h-auto items-center gap-2 px-2 py-1 text-zinc-800 dark:text-zinc-100"
              >
                <Avatar
                  size="small"
                  icon={<UserOutlined />}
                  style={{ background: token.colorPrimary }}
                />
                <span className="hidden max-w-[120px] truncate text-sm font-medium sm:inline">
                  {user?.name}
                </span>
              </Button>
            </Dropdown>
          </Space>
        </Header>
        <Content className="bg-transparent p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="mx-auto max-w-[1600px]"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </Content>
      </Layout>
    </Layout>
  )
}
