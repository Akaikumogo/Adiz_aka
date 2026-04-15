import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator'
import { TurnstileService } from './turnstile.service'
import { InternalApiKeyGuard } from './internal-api-key.guard'
export class IngestDto {
  @IsString()
  @MinLength(1)
  deviceIp: string

  @IsString()
  @MinLength(1)
  cardId: string

  /** Hikvision: turli ISO / oddiy qator — `new Date()` bilan yoziladi */
  @IsString()
  @MinLength(4)
  timestamp: string

  /** Bo‘lmasa qurilma yo‘nalishi (seed) bo‘yicha */
  @IsOptional()
  @IsIn(['entry', 'exit'])
  eventType?: 'entry' | 'exit'

  /** Yangi xodim yaratilganda (Hikvision `name`) */
  @IsOptional()
  @IsString()
  fullName?: string
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
      fullName: dto.fullName,
    })
  }
}
