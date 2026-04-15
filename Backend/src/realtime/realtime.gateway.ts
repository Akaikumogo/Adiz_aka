import { Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({
  cors: { origin: process.env.CORS_ORIGIN?.split(',') ?? '*' },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private readonly log = new Logger(RealtimeGateway.name)

  constructor(private readonly jwt: JwtService) {}

  handleConnection(client: Socket) {
    try {
      const auth = client.handshake.auth as { token?: string } | undefined
      const header = client.handshake.headers.authorization
      const token =
        auth?.token ||
        (typeof header === 'string' && header.startsWith('Bearer ')
          ? header.slice(7)
          : null)
      if (!token) {
        client.disconnect()
        return
      }
      this.jwt.verify(token)
    } catch {
      client.disconnect()
      return
    }
    this.log.debug(`Client connected ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    this.log.debug(`Client disconnected ${client.id}`)
  }

  emitActivityEvent(payload: Record<string, unknown>) {
    this.server?.emit('activity', payload)
  }

  emitAccessEvent(payload: Record<string, unknown>) {
    this.server?.emit('access', payload)
  }

  emitDashboardRefresh() {
    this.server?.emit('dashboard:refresh', { at: Date.now() })
  }
}
