/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  apiFetch,
  apiUrl,
  getToken,
  setStoredUser,
  setToken,
} from '../lib/api'

export interface AuthUser {
  id: string
  name: string
  role: string
}

interface AuthContextValue {
  user: AuthUser | null
  bootstrapped: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [bootstrapped, setBootstrapped] = useState(false)

  useEffect(() => {
    const run = async () => {
      const t = getToken()
      if (!t) {
        setBootstrapped(true)
        return
      }
      try {
        const u = await apiFetch<{ id: string; email: string; role: string }>(
          '/api/auth/me',
        )
        setUser({ id: u.id, name: u.email, role: u.role })
        setStoredUser({ id: u.id, email: u.email, role: u.role })
      } catch {
        setToken(null)
        setStoredUser(null)
        setUser(null)
      } finally {
        setBootstrapped(true)
      }
    }
    void run()
  }, [])

  useEffect(() => {
    const h = () => {
      setUser(null)
    }
    window.addEventListener('wp:unauthorized', h)
    return () => window.removeEventListener('wp:unauthorized', h)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    })
    if (!res.ok) {
      let msg = 'Kirish muvaffaqiyatsiz'
      try {
        const j = (await res.json()) as { message?: string | string[] }
        if (typeof j.message === 'string') msg = j.message
        else if (Array.isArray(j.message)) msg = j.message.join(', ')
      } catch {
        const t = await res.text()
        if (t) msg = t
      }
      throw new Error(msg)
    }
    const data = (await res.json()) as {
      access_token: string
      user: { id: string; email: string; role: string }
    }
    setToken(data.access_token)
    setStoredUser(data.user)
    setUser({
      id: data.user.id,
      name: data.user.email,
      role: data.user.role,
    })
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setStoredUser(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      bootstrapped,
      isAuthenticated: !!user,
      login,
      logout,
    }),
    [user, bootstrapped, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth AuthProvider ichida bo‘lishi kerak')
  return ctx
}
