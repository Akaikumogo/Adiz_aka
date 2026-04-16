import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InternalApiKeyGuard } from './internal-api-key.guard'

function mockContext(): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers: {} }),
    }),
  } as ExecutionContext
}

describe('InternalApiKeyGuard', () => {
  it('throws 401 in production when INTERNAL_API_KEY is empty', () => {
    const config = {
      get: (key: string, defaultValue?: string) => {
        if (key === 'INTERNAL_API_KEY') return ''
        if (key === 'NODE_ENV') return 'production'
        return defaultValue ?? ''
      },
    } as ConfigService
    const guard = new InternalApiKeyGuard(config)
    expect(() => guard.canActivate(mockContext())).toThrow(UnauthorizedException)
  })

  it('allows when not production and INTERNAL_API_KEY is empty', () => {
    const config = {
      get: (key: string, defaultValue?: string) => {
        if (key === 'INTERNAL_API_KEY') return ''
        if (key === 'NODE_ENV') return 'development'
        return defaultValue ?? ''
      },
    } as ConfigService
    const guard = new InternalApiKeyGuard(config)
    expect(guard.canActivate(mockContext())).toBe(true)
  })

  it('allows when key matches', () => {
    const config = {
      get: (key: string, defaultValue?: string) => {
        if (key === 'INTERNAL_API_KEY') return 'secret'
        return defaultValue ?? ''
      },
    } as ConfigService
    const guard = new InternalApiKeyGuard(config)
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'x-internal-key': 'secret' },
        }),
      }),
    } as ExecutionContext
    expect(guard.canActivate(ctx)).toBe(true)
  })
})
