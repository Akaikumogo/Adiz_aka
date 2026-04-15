import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ActivityEventEntity } from '../database/entities/activity-event.entity'
import { ComputerEntity } from '../database/entities/computer.entity'
import { ActivityStatus } from '../common/enums/activity-status.enum'
import { RealtimeGateway } from '../realtime/realtime.gateway'

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(ActivityEventEntity)
    private readonly repo: Repository<ActivityEventEntity>,
    @InjectRepository(ComputerEntity)
    private readonly computersRepo: Repository<ComputerEntity>,
    private readonly realtime: RealtimeGateway,
  ) {}

  async ingestBatch(
    computer: ComputerEntity,
    events: { timestamp: number; status: ActivityStatus; raw?: Record<string, unknown> }[],
  ) {
    const rows = events.map((e) =>
      this.repo.create({
        computerId: computer.id,
        timestamp: String(e.timestamp),
        status: e.status,
        raw: e.raw ?? null,
      }),
    )
    await this.repo.save(rows)
    await this.computersRepo.update(computer.id, { lastSeenAt: new Date() })
    this.realtime.emitActivityEvent({
      computerId: computer.id,
      count: events.length,
    })
    this.realtime.emitDashboardRefresh()
    return { accepted: events.length }
  }
}
