import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { TurnstileService } from './turnstile.service'
import { InternalApiKeyGuard } from './internal-api-key.guard'
import { IngestDto } from './turnstile-internal.controller'

@Controller('internal/attendance')
@UseGuards(InternalApiKeyGuard)
export class AttendanceInternalController {
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
