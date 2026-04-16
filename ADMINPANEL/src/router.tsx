import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router'
import { AppShellLayout } from './components/layout/AppShellLayout'
import { AdminsPage } from './pages/AdminsPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { AttendancePage } from './pages/AttendancePage'
import { ComputersPage } from './pages/ComputersPage'
import { DashboardPage } from './pages/DashboardPage'
import { DepartmentsPage } from './pages/DepartmentsPage'
import { EmployeesPage } from './pages/EmployeesPage'
import { LoginPage } from './pages/LoginPage'
import { PositionsPage } from './pages/PositionsPage'
import { RoomsPage } from './pages/RoomsPage'

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

const appShellRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app-shell',
  component: AppShellLayout,
})

const dashboardRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: '/',
  component: DashboardPage,
})

const employeesRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: '/xodimlar',
  component: EmployeesPage,
})

const attendanceRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: '/yoqlama',
  component: AttendancePage,
})

const analyticsRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: '/analitika',
  component: AnalyticsPage,
})

const adminsRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: '/adminlar',
  component: AdminsPage,
})

const departmentsRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: '/bolimlar',
  component: DepartmentsPage,
})

const roomsRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: '/xonalar',
  component: RoomsPage,
})

const positionsRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: '/lavozimlar',
  component: PositionsPage,
})

const computersRoute = createRoute({
  getParentRoute: () => appShellRoute,
  path: '/kompyuterlar',
  component: ComputersPage,
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

const routeTree = rootRoute.addChildren([
  appShellRoute.addChildren([
    dashboardRoute,
    departmentsRoute,
    roomsRoute,
    positionsRoute,
    computersRoute,
    adminsRoute,
    employeesRoute,
    attendanceRoute,
    analyticsRoute,
  ]),
  loginRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
