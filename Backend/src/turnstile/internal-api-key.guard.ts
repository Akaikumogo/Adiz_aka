import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('INTERNAL_API_KEY', '')
    if (!expected?.trim()) {
      return true
    }
    const req = context.switchToHttp().getRequest<{
      headers: { 'x-internal-key'?: string; authorization?: string }
    }>()
    const xKey = req.headers['x-internal-key']
    const auth = req.headers.authorization ?? ''
    const bearer = auth.toLowerCase().startsWith('bearer ')
      ? auth.slice(7).trim()
      : ''
    const key = xKey || bearer
    if (key !== expected) {
      throw new UnauthorizedException('Invalid internal key')
    }
    return true
  }
}
