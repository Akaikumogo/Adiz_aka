const base = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''

export function apiUrl(path: string): string {
  if (path.startsWith('/')) return `${base}${path}`
  return `${base}/${path}`
}

const TOKEN_KEY = 'wp_token'
const USER_KEY = 'wp_user'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function getStoredUser(): { id: string; email: string; role: string } | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as { id: string; email: string; role: string }
  } catch {
    return null
  }
}

export function setStoredUser(
  user: { id: string; email: string; role: string } | null,
) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  else localStorage.removeItem(USER_KEY)
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  const t = getToken()
  if (t) headers.set('Authorization', `Bearer ${t}`)
  const res = await fetch(apiUrl(path), { ...options, headers })
  if (res.status === 401) {
    setToken(null)
    setStoredUser(null)
    window.dispatchEvent(new Event('wp:unauthorized'))
  }
  if (!res.ok) {
    const text = await res.text()
    let msg = text || res.statusText
    try {
      const j = JSON.parse(text) as { message?: string | string[] }
      if (typeof j.message === 'string') msg = j.message
      else if (Array.isArray(j.message)) msg = j.message.join(', ')
    } catch {
      /* plain text */
    }
    throw new Error(msg)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}
