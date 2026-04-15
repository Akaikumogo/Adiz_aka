import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { IsIn, IsISO8601, IsString, MinLength } from 'class-validator'
import { TurnstileService } from './turnstile.service'
import { InternalApiKeyGuard } from './internal-api-key.guard'
class IngestDto {
  @IsString()
  @MinLength(1)
  deviceIp: string

  @IsString()
  @MinLength(1)
  cardId: string

  @IsISO8601()
  timestamp: string

  /** E’tiborsiz: backend qurilma IP bo‘yicha in/out ni o‘zi aniqlaydi */
  @IsIn(['entry', 'exit'])
  eventType: 'entry' | 'exit'
}

@Controller('internal/turnstile')
@UseGuards(InternalApiKeyGuard)
export class TurnstileInternalController {
  constructor(private readonly svc: TurnstileService) {}

  @Post('events')
  ingest(@Body() dto: IngestDto) {
    return this.svc.recordIngestEvent({
      deviceIp: dto.deviceIp,
      cardId: dto.cardId,
      timestamp: dto.timestamp,
      eventType: dto.eventType,
    })
  }
}
