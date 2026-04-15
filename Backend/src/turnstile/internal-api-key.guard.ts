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
    const req = context.switchToHttp().getRequest<{ headers: { 'x-internal-key'?: string } }>()
    const key = req.headers['x-internal-key']
    const expected = this.config.get<string>('INTERNAL_API_KEY', '')
    if (!expected || key !== expected) {
      throw new UnauthorizedException('Invalid internal key')
    }
    return true
  }
}
