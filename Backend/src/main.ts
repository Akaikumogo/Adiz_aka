import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import type { NextFunction, Request, Response } from 'express'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.getHttpAdapter().getInstance().set('etag', false)
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    next()
  })
  app.setGlobalPrefix('api')
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )
  const origins = process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()) ?? true
  app.enableCors({ origin: origins, credentials: true })
  const port = Number(process.env.PORT ?? 3000)
  await app.listen(port)
  // eslint-disable-next-line no-console
  console.log(`API http://localhost:${port}/api`)
}
bootstrap()
