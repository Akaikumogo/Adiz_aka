import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { App as AntApp, ConfigProvider, theme } from 'antd'
import uzUZ from 'antd/locale/uz_UZ'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { router } from './router'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

function ThemedApp() {
  const { mode } = useTheme()
  const isDark = mode === 'dark'

  return (
    <ConfigProvider
      locale={uzUZ}
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          borderRadius: 10,
          colorPrimary: '#2563eb',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          colorBgLayout: isDark ? '#09090b' : '#fafafa',
          colorBgContainer: isDark ? '#18181b' : '#ffffff',
          colorBgElevated: isDark ? '#27272a' : '#ffffff',
          colorBorder: isDark ? '#3f3f46' : '#e4e4e7',
          colorBorderSecondary: isDark ? '#27272a' : '#f4f4f5',
          colorText: isDark ? '#fafafa' : 'rgba(0,0,0,0.88)',
          colorTextSecondary: isDark ? '#a1a1aa' : 'rgba(0,0,0,0.65)',
          colorTextTertiary: isDark ? '#71717a' : 'rgba(0,0,0,0.45)',
        },
        components: {
          Layout: {
            headerBg: 'transparent',
            bodyBg: 'transparent',
          },
          Menu: {
            itemBorderRadius: 8,
            iconSize: 18,
            darkItemBg: 'transparent',
            itemBg: 'transparent',
          },
          Card: {
            paddingLG: 20,
            colorBgContainer: isDark ? '#18181b' : '#ffffff',
          },
          Table: {
            colorBgContainer: isDark ? '#18181b' : '#ffffff',
            headerBg: isDark ? '#27272a' : '#fafafa',
            headerColor: isDark ? '#e4e4e7' : 'rgba(0,0,0,0.88)',
            rowHoverBg: isDark ? 'rgba(63,63,70,0.5)' : 'rgba(0,0,0,0.02)',
          },
          Input: {
            colorBgContainer: isDark ? '#27272a' : '#ffffff',
            activeBorderColor: '#2563eb',
            hoverBorderColor: isDark ? '#52525b' : '#d4d4d8',
          },
          DatePicker: {
            colorBgContainer: isDark ? '#27272a' : '#ffffff',
          },
          Select: {
            colorBgContainer: isDark ? '#27272a' : '#ffffff',
          },
          Drawer: {
            colorBgElevated: isDark ? '#18181b' : '#ffffff',
          },
          Modal: {
            contentBg: isDark ? '#18181b' : '#ffffff',
            headerBg: isDark ? '#18181b' : '#ffffff',
          },
          Pagination: {
            colorBgContainer: isDark ? '#27272a' : '#ffffff',
          },
        },
      }}
    >
      <AntApp>
        <RouterProvider router={router} />
      </AntApp>
    </ConfigProvider>
  )
}

function AppWithAuth() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemedApp />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppWithAuth />
    </QueryClientProvider>
  )
}
