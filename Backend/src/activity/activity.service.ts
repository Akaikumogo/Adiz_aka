/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
// activity.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComputerEntity } from '../database/entities/computer.entity';
import { ActivityEventEntity } from '../database/entities/activity-event.entity';
import { ActivityStatus } from '../common/enums/activity-status.enum';

@Injectable()
export class ActivityService {
  private eventDedup = new Set<string>();
  private lastStatusMap = new Map<number, ActivityStatus>();

  constructor(
    @InjectRepository(ActivityEventEntity)
    private readonly repo: Repository<ActivityEventEntity>,

    @InjectRepository(ComputerEntity)
    private readonly computersRepo: Repository<ComputerEntity>,
  ) {}

  // -----------------------------
  // RESOLVE COMPUTER BY MAC
  // -----------------------------
  async resolveComputer(macAddress: string) {
    console.log('resolveComputer', macAddress);
    let computer = await this.computersRepo.findOne({
      where: { macAddress },
    });

    if (!computer) {
      computer = this.computersRepo.create({
        macAddress,
        name: `PC-${macAddress.slice(-5)}`,
        lastSeenAt: new Date(),
      });

      computer = await this.computersRepo.save(computer);
    }

    return computer;
  }

  // -----------------------------
  // INGEST EVENTS
  // -----------------------------
  async ingestBatch(
    computer: ComputerEntity,
    events: {
      timestamp: number;
      status: ActivityStatus;
      raw?: Record<string, unknown>;
    }[],
  ) {
    const rows = [];

    for (const e of events) {
      const key = `${computer.id}:${e.timestamp}:${e.status}`;

      if (this.eventDedup.has(key)) continue;
      this.eventDedup.add(key);

      rows.push(
        this.repo.create({
          computerId: computer.id,
          timestamp: String(e.timestamp),
          status: e.status,
          raw: {
            ...(e.raw ?? {}),
            macAddress: computer.macAddress,
          },
        }),
      );
    }

    if (rows.length === 0) return { accepted: 0 };

    await this.repo.save(rows);

    await this.computersRepo.update(computer.id, {
      lastSeenAt: new Date(),
    });

    const latest = events[events.length - 1]?.status;
    const prev = this.lastStatusMap.get(Number(computer.id));

    // 🔥 SNAPSHOT TRIGGER
    if (
      computer.roomId &&
      latest &&
      (latest === ActivityStatus.IDLE || latest === ActivityStatus.BREAK) &&
      prev !== latest
    ) {
      await this.triggerCameraSnapshot(
        Number(computer.roomId),
        Number(computer.id),
        latest,
      );
    }

    if (latest) {
      this.lastStatusMap.set(Number(computer.id), latest);
    }

    this.realtime.emitActivityEvent({
      computerId: computer.id,
      count: rows.length,
    });

    this.realtime.emitDashboardRefresh();

    return { accepted: rows.length };
  }

  // stub (send later)
  private async triggerCameraSnapshot(
    roomId: number,
    computerId: number,
    status: ActivityStatus,
  ) {
    console.log('snapshot:', { roomId, computerId, status });
  }

  // stub realtime
  private realtime = {
    emitActivityEvent: (p: any) => {},
    emitDashboardRefresh: () => {},
  };
}
