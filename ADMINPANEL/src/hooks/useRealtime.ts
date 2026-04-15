import { useEffect } from 'react'
import { io, type Socket } from 'socket.io-client'
import { getToken } from '../lib/api'

let socket: Socket | null = null

export function getRealtimeSocket(): Socket | null {
  return socket
}

export function useRealtime(
  onDashboardRefresh: () => void,
  onActivity?: (payload: unknown) => void,
) {
  useEffect(() => {
    const token = getToken()
    if (!token) return
    const base = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''
    const url = base ? `${base}/realtime` : '/realtime'
    socket = io(url, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token },
    })
    socket.on('dashboard:refresh', onDashboardRefresh)
    socket.on('activity', (p) => onActivity?.(p))
    return () => {
      socket?.off('dashboard:refresh', onDashboardRefresh)
      socket?.disconnect()
      socket = null
    }
  }, [onDashboardRefresh, onActivity])
}
