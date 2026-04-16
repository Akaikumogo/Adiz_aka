import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, IsNull, In } from 'typeorm';
import { ActivityEventEntity } from '../database/entities/activity-event.entity';
import { EmployeeEntity } from '../database/entities/employee.entity';
import { ComputerEntity } from '../database/entities/computer.entity';
import { DailyAggregateEntity } from '../database/entities/daily-aggregate.entity';
import { DepartmentEntity } from '../database/entities/department.entity';
import { AccessEventEntity } from '../database/entities/access-event.entity';
import { ActivityStatus } from '../common/enums/activity-status.enum';

function maxD(a: Date, b: Date): Date {
  return a.getTime() >= b.getTime() ? a : b;
}

function minD(a: Date, b: Date): Date {
  return a.getTime() <= b.getTime() ? a : b;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(ActivityEventEntity)
    private readonly activityRepo: Repository<ActivityEventEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly empRepo: Repository<EmployeeEntity>,
    @InjectRepository(ComputerEntity)
    private readonly compRepo: Repository<ComputerEntity>,
    @InjectRepository(DailyAggregateEntity)
    private readonly dailyRepo: Repository<DailyAggregateEntity>,
    @InjectRepository(DepartmentEntity)
    private readonly deptRepo: Repository<DepartmentEntity>,
    @InjectRepository(AccessEventEntity)
    private readonly accessRepo: Repository<AccessEventEntity>,
    private readonly config: ConfigService,
  ) {}

  async accessTurnstileSummary(from: string, to: string) {
    const start = new Date(from + 'T00:00:00.000Z');
    const end = new Date(to + 'T23:59:59.999Z');
    const entryCount = await this.accessRepo
      .createQueryBuilder('a')
      .innerJoin('a.employee', 'e')
      .where('a.eventType = :et', { et: 'entry' })
      .andWhere('a.timestamp BETWEEN :start AND :end', { start, end })
      .andWhere('e.departmentId IS NOT NULL')
      .andWhere("TRIM(COALESCE(e.position, '')) <> ''")
      .getCount();
    const exitCount = await this.accessRepo
      .createQueryBuilder('a')
      .innerJoin('a.employee', 'e')
      .where('a.eventType = :et', { et: 'exit' })
      .andWhere('a.timestamp BETWEEN :start AND :end', { start, end })
      .andWhere('e.departmentId IS NOT NULL')
      .andWhere("TRIM(COALESCE(e.position, '')) <> ''")
      .getCount();
    const byEmployee = await this.accessRepo.manager.query<
      { employeeId: string; fullName: string; entries: number; exits: number }[]
    >(
      `
      SELECT e.id::text AS "employeeId", e.full_name AS "fullName",
        (COUNT(*) FILTER (WHERE a.event_type = 'entry'))::int AS entries,
        (COUNT(*) FILTER (WHERE a.event_type = 'exit'))::int AS exits
      FROM access_events a
      INNER JOIN employees e ON e.id = a.employee_id
      WHERE a.timestamp >= $1 AND a.timestamp <= $2
        AND e.department_id IS NOT NULL
        AND TRIM(COALESCE(e."position", '')) <> ''
      GROUP BY e.id, e.full_name
      ORDER BY (
        (COUNT(*) FILTER (WHERE a.event_type = 'entry')) +
        (COUNT(*) FILTER (WHERE a.event_type = 'exit'))
      ) DESC
      LIMIT 100
      `,
      [start, end],
    );
    return { entryCount, exitCount, byEmployee };
  }

  async summary(from: Date, to: Date) {
    const empCount = await this.empRepo
      .createQueryBuilder('e')
      .where('e.isActive = :ia', { ia: true })
      .andWhere('e.departmentId IS NOT NULL')
      .andWhere("TRIM(COALESCE(e.position, '')) <> ''")
      .getCount();
    const activeComputers = await this.activityRepo
      .createQueryBuilder('a')
      .select('COUNT(DISTINCT a.computerId)', 'cnt')
      .where('a.createdAt BETWEEN :from AND :to', { from, to })
      .getRawOne<{ cnt: string }>();
    const totalEvents = await this.activityRepo.count({
      where: { createdAt: Between(from, to) },
    });
    const avgRow = await this.dailyRepo
      .createQueryBuilder('d')
      .innerJoin(EmployeeEntity, 'e', 'e.id = d.employeeId')
      .select('AVG(d.avgEfficiency)', 'avg')
      .where('d.date BETWEEN :f AND :t', {
        f: from.toISOString().slice(0, 10),
        t: to.toISOString().slice(0, 10),
      })
      .andWhere('e.departmentId IS NOT NULL')
      .andWhere("TRIM(COALESCE(e.position, '')) <> ''")
      .getRawOne<{ avg: string }>();
    const sumMin = await this.dailyRepo
      .createQueryBuilder('d')
      .innerJoin(EmployeeEntity, 'e', 'e.id = d.employeeId')
      .select('SUM(d.activeMinutes)', 's')
      .where('d.date BETWEEN :f AND :t', {
        f: from.toISOString().slice(0, 10),
        t: to.toISOString().slice(0, 10),
      })
      .andWhere('e.departmentId IS NOT NULL')
      .andWhere("TRIM(COALESCE(e.position, '')) <> ''")
      .getRawOne<{ s: string }>();
    return {
      totalEmployees: empCount,
      activeComputersInRange: Number(activeComputers?.cnt ?? 0),
      totalActivityEvents: totalEvents,
      avgEfficiency: Math.round(Number(avgRow?.avg) || 0),
      totalActiveMinutes: Number(sumMin?.s) || 0,
      from: from.toISOString(),
      to: to.toISOString(),
    };
  }

  async kpis(from: string, to: string) {
    const start = new Date(from + 'T00:00:00.000Z');
    const end = new Date(to + 'T23:59:59.999Z');
    const s = await this.summary(start, end);
    const idleSum = await this.dailyRepo
      .createQueryBuilder('d')
      .innerJoin(EmployeeEntity, 'e', 'e.id = d.employeeId')
      .select('SUM(d.idleMinutes)', 's')
      .where('d.date BETWEEN :f AND :t', { f: from, t: to })
      .andWhere('e.departmentId IS NOT NULL')
      .andWhere("TRIM(COALESCE(e.position, '')) <> ''")
      .getRawOne<{ s: string }>();
    const today = new Date().toISOString().slice(0, 10);
    const activeToday = await this.activityRepo
      .createQueryBuilder('a')
      .select('COUNT(DISTINCT c.employeeId)', 'cnt')
      .innerJoin('a.computer', 'c')
      .innerJoin('c.employee', 'emp')
      .where('a.createdAt >= :d', { d: new Date(today + 'T00:00:00.000Z') })
      .andWhere('emp.departmentId IS NOT NULL')
      .andWhere("TRIM(COALESCE(emp.position, '')) <> ''")
      .getRawOne<{ cnt: string }>();
    return {
      totalEmployees: s.totalEmployees,
      activeToday: Number(activeToday?.cnt ?? 0),
      avgEfficiency: s.avgEfficiency,
      totalActiveMinutes: s.totalActiveMinutes,
      totalIdleMinutes: Number(idleSum?.s) || 0,
    };
  }

  async efficiencyTrend(from: Date, to: Date) {
    const rows = await this.dailyRepo
      .createQueryBuilder('d')
      .innerJoin(EmployeeEntity, 'e', 'e.id = d.employeeId')
      .select('d.date', 'date')
      .addSelect('AVG(d.avgEfficiency)', 'avgEfficiency')
      .where('d.date BETWEEN :f AND :t', {
        f: from.toISOString().slice(0, 10),
        t: to.toISOString().slice(0, 10),
      })
      .andWhere('e.departmentId IS NOT NULL')
      .andWhere("TRIM(COALESCE(e.position, '')) <> ''")
      .groupBy('d.date')
      .orderBy('d.date', 'ASC')
      .getRawMany<{ date: string; avgEfficiency: string }>();
    return rows.map((r) => ({
      date: r.date,
      label: r.date.slice(8, 10) + '.' + r.date.slice(5, 7),
      avgEfficiency: Math.round(Number(r.avgEfficiency) || 0),
    }));
  }

  async dailyRecordsForUi(from: string, to: string, search?: string) {
    const start = new Date(from + 'T00:00:00.000Z');
    const end = new Date(to + 'T23:59:59.999Z');
    const qb = this.activityRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.computer', 'c')
      .leftJoinAndSelect('c.employee', 'e')
      .where('a.createdAt BETWEEN :start AND :end', { start, end });
    if (search?.trim()) {
      qb.andWhere('(e.fullName ILIKE :q OR c.name ILIKE :q)', {
        q: `%${search.trim()}%`,
      });
    }
    qb.andWhere(
      "(e.id IS NULL OR (e.departmentId IS NOT NULL AND TRIM(COALESCE(e.position, '')) <> ''))",
    );
    qb.orderBy('a.createdAt', 'DESC').take(500);
    const events = await qb.getMany();
    return events.map((ev) => this.mapActivityToUiRow(ev));
  }

  private mapActivityToUiRow(ev: ActivityEventEntity) {
    const emp = ev.computer?.employee;
    const d = ev.createdAt;
    const dateStr = d.toISOString().slice(0, 10);
    const tsNum = Number(ev.timestamp);
    const eff =
      ev.status === ActivityStatus.WORKING
        ? 85
        : ev.status === ActivityStatus.IDLE
          ? 45
          : 30;
    return {
      id: `${ev.computerId}-${ev.id}`,
      employeeId: emp?.id ?? ev.computerId,
      employeeName: emp?.fullName ?? ev.computer?.name ?? '—',
      avatarUrl: emp?.avatarUrl ?? null,
      date: dateStr,
      officeIn: '—',
      roomIn: '—',
      officeOut: '—',
      activeTime: ev.status === ActivityStatus.WORKING ? 10 : 0,
      idleTime: ev.status === ActivityStatus.IDLE ? 10 : 0,
      lunchTime: ev.status === ActivityStatus.BREAK ? 10 : 0,
      efficiency: eff,
      status: ev.status,
      timestamp: tsNum,
      timelineEvents: [],
      segments: [],
    };
  }

  async efficiencyByEmployee() {
    const rows = await this.dailyRepo
      .createQueryBuilder('d')
      .innerJoin(EmployeeEntity, 'e', 'e.id = d.employeeId')
      .select('d.employeeId', 'employeeId')
      .addSelect('e.full_name', 'fullName')
      .addSelect('AVG(d.avgEfficiency)', 'avgEfficiency')
      .where('e.isActive = true')
      .andWhere('e.departmentId IS NOT NULL')
      .andWhere("TRIM(COALESCE(e.position, '')) <> ''")
      .groupBy('d.employeeId')
      .addGroupBy('e.full_name')
      .getRawMany<{
        employeeId: string;
        fullName: string;
        avgEfficiency: string;
      }>();

    return rows.map((r) => ({
      employeeId: r.employeeId,
      name: r.fullName.split(/\s+/)[0] ?? r.fullName,
      avgEfficiency: Math.round(Number(r.avgEfficiency) || 0),
    }));
  }

  async efficiencyByDepartment() {
    const depts = await this.deptRepo.find();
    const out: { department: string; avgEfficiency: number }[] = [];
    for (const d of depts) {
      const emps = (
        await this.empRepo.find({ where: { departmentId: d.id } })
      ).filter((e) => (e.position ?? '').trim() !== '');
      let sum = 0;
      let n = 0;
      for (const e of emps) {
        const row = await this.dailyRepo
          .createQueryBuilder('x')
          .select('AVG(x.avgEfficiency)', 'avg')
          .where('x.employeeId = :id', { id: e.id })
          .getRawOne<{ avg: string }>();
        if (row?.avg != null && !Number.isNaN(Number(row.avg))) {
          sum += Number(row.avg);
          n += 1;
        }
      }
      out.push({
        department: d.name,
        avgEfficiency: n ? Math.round(sum / n) : 0,
      });
    }
    return out;
  }

  async runDailyAggregate(forDate: string) {
    const start = new Date(forDate + 'T00:00:00.000Z');
    const end = new Date(forDate + 'T23:59:59.999Z');
    await this.dailyRepo.delete({ date: forDate });
    const emps = (
      await this.empRepo.find({
        where: { isActive: true, departmentId: Not(IsNull()) },
      })
    ).filter((e) => (e.position ?? '').trim() !== '');
    for (const emp of emps) {
      const computers = await this.compRepo.find({
        where: { employeeId: emp.id },
      });
      let active = 0;
      let idle = 0;
      let brk = 0;
      for (const c of computers) {
        const evs = await this.activityRepo.find({
          where: {
            computerId: c.id,
            createdAt: Between(start, end),
          },
        });
        for (const e of evs) {
          if (e.status === ActivityStatus.WORKING) active += 1;
          else if (e.status === ActivityStatus.IDLE) idle += 1;
          else if (e.status === ActivityStatus.BREAK) brk += 1;
        }
      }
      const total = active + idle + brk || 1;
      const avgEff = Math.round((active / total) * 100);
      await this.dailyRepo.save(
        this.dailyRepo.create({
          date: forDate,
          employeeId: emp.id,
          activeMinutes: active * 10,
          idleMinutes: idle * 10,
          breakMinutes: brk * 10,
          avgEfficiency: avgEff,
        }),
      );
    }
  }

  async attendanceForDate(dateStr: string) {
    const start = new Date(dateStr + 'T00:00:00.000Z');
    const end = new Date(dateStr + 'T23:59:59.999Z');
    const rows = await this.empRepo.manager.query<
      {
        employeeId: string;
        fullName: string;
        departmentName: string | null;
        position: string;
        firstEntryAt: Date | null;
        lastExitAt: Date | null;
      }[]
    >(
      `
      SELECT e.id::text AS "employeeId",
             e.full_name AS "fullName",
             dep.name AS "departmentName",
             e."position" AS "position",
             (
               SELECT MIN(a.timestamp)
               FROM access_events a
               WHERE a.employee_id = e.id
                 AND a.event_type = 'entry'
                 AND a.timestamp >= $1 AND a.timestamp <= $2
             ) AS "firstEntryAt",
             (
               SELECT MAX(a.timestamp)
               FROM access_events a
               WHERE a.employee_id = e.id
                 AND a.event_type = 'exit'
                 AND a.timestamp >= $1 AND a.timestamp <= $2
             ) AS "lastExitAt"
      FROM employees e
      LEFT JOIN departments dep ON dep.id = e.department_id
      WHERE e.is_active = true
        AND e.department_id IS NOT NULL
        AND TRIM(COALESCE(e."position", '')) <> ''
      ORDER BY e.full_name ASC
      `,
      [start, end],
    );
    return rows.map((r) => ({
      employeeId: r.employeeId,
      fullName: r.fullName,
      departmentName: r.departmentName,
      position: r.position,
      present: r.firstEntryAt != null,
      firstEntryAt: r.firstEntryAt
        ? new Date(r.firstEntryAt).toISOString()
        : null,
      lastExitAt: r.lastExitAt ? new Date(r.lastExitAt).toISOString() : null,
    }));
  }

  private activityEventTime(ev: ActivityEventEntity): Date {
    const ts = Number(ev.timestamp);
    if (!Number.isNaN(ts) && ts > 0) return new Date(ts);
    return ev.createdAt;
  }

  private buildOfficeIntervals(
    events: AccessEventEntity[],
    dayStart: Date,
    dayEnd: Date,
    now: Date,
    dateStr: string,
  ): { start: Date; end: Date }[] {
    const sorted = [...events].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
    let pending: Date | null = null;
    const raw: { start: Date; end: Date }[] = [];
    for (const e of sorted) {
      if (e.eventType === 'entry') {
        pending = e.timestamp;
      } else if (e.eventType === 'exit') {
        if (pending) {
          raw.push({ start: pending, end: e.timestamp });
          pending = null;
        }
      }
    }
    if (pending) {
      const isToday = dateStr === now.toISOString().slice(0, 10);
      const cap = isToday ? minD(now, dayEnd) : dayEnd;
      if (cap.getTime() > pending.getTime())
        raw.push({ start: pending, end: cap });
    }
    return raw
      .map((iv) => ({
        start: maxD(iv.start, dayStart),
        end: minD(iv.end, dayEnd),
      }))
      .filter((iv) => iv.end.getTime() > iv.start.getTime());
  }

  private addMaskedSeconds(
    t0: Date,
    durMs: number,
    office: { start: Date; end: Date }[],
  ): number {
    if (durMs <= 0) return 0;
    const t1 = new Date(t0.getTime() + durMs);
    let sec = 0;
    for (const iv of office) {
      const a = maxD(t0, iv.start);
      const b = minD(t1, iv.end);
      if (b.getTime() > a.getTime()) sec += (b.getTime() - a.getTime()) / 1000;
    }
    return sec;
  }

  async employeeDayReport(employeeId: string, dateStr: string) {
    const emp = await this.empRepo.findOne({ where: { id: employeeId } });
    if (!emp) throw new NotFoundException('Employee not found');
    const dayStart = new Date(dateStr + 'T00:00:00.000Z');
    const dayEnd = new Date(dateStr + 'T23:59:59.999Z');
    const now = new Date();
    const slotSec = Number(this.config.get('ACTIVITY_SLOT_SECONDS', '60'));

    const access = await this.accessRepo.find({
      where: { employeeId, timestamp: Between(dayStart, dayEnd) },
      order: { timestamp: 'ASC' },
    });

    const entries = access
      .filter((a) => a.eventType === 'entry')
      .map((a) => ({
        id: a.id,
        at: a.timestamp.toISOString(),
        snapshotUrl: a.snapshotUrl,
      }));
    const exits = access
      .filter((a) => a.eventType === 'exit')
      .map((a) => ({
        id: a.id,
        at: a.timestamp.toISOString(),
        snapshotUrl: a.snapshotUrl,
      }));

    const officeIntervals = this.buildOfficeIntervals(
      access,
      dayStart,
      dayEnd,
      now,
      dateStr,
    );
    let officeDurationSeconds = 0;
    for (const iv of officeIntervals) {
      officeDurationSeconds += (iv.end.getTime() - iv.start.getTime()) / 1000;
    }

    const computers = await this.compRepo.find({ where: { employeeId } });
    const compIds = computers.map((c) => c.id);
    let activeSeconds = 0;
    let idleSeconds = 0;
    let breakSeconds = 0;
    const breaks: { start: string; end: string; kind: 'break' | 'idle' }[] = [];

    if (compIds.length > 0) {
      const evs = await this.activityRepo.find({
        where: {
          computerId: In(compIds),
          createdAt: Between(dayStart, dayEnd),
        },
        order: { createdAt: 'ASC' },
      });
      evs.sort(
        (a, b) =>
          this.activityEventTime(a).getTime() -
          this.activityEventTime(b).getTime(),
      );

      for (let i = 0; i < evs.length; i++) {
        const ev = evs[i];
        const t0 = this.activityEventTime(ev);
        if (
          t0.getTime() < dayStart.getTime() ||
          t0.getTime() > dayEnd.getTime()
        )
          continue;
        const next = evs[i + 1];
        const nextT = next ? this.activityEventTime(next) : null;
        const slotMs = slotSec * 1000;
        const untilNext = nextT
          ? Math.max(0, nextT.getTime() - t0.getTime())
          : slotMs;
        const durMs = Math.min(
          slotMs,
          untilNext,
          dayEnd.getTime() - t0.getTime(),
        );
        if (durMs <= 0) continue;

        const masked =
          officeIntervals.length > 0
            ? this.addMaskedSeconds(t0, durMs, officeIntervals)
            : 0;
        if (masked <= 0) continue;

        if (ev.status === ActivityStatus.WORKING) activeSeconds += masked;
        else if (ev.status === ActivityStatus.IDLE) idleSeconds += masked;
        else if (ev.status === ActivityStatus.BREAK) breakSeconds += masked;

        if (
          (ev.status === ActivityStatus.BREAK ||
            ev.status === ActivityStatus.IDLE) &&
          officeIntervals.length > 0
        ) {
          const t1 = new Date(t0.getTime() + durMs);
          for (const iv of officeIntervals) {
            const a = maxD(t0, iv.start);
            const b = minD(t1, iv.end);
            if (b.getTime() > a.getTime()) {
              breaks.push({
                start: a.toISOString(),
                end: b.toISOString(),
                kind: ev.status === ActivityStatus.BREAK ? 'break' : 'idle',
              });
            }
          }
        }
      }
    }

    return {
      employeeId: emp.id,
      fullName: emp.fullName,
      date: dateStr,
      entries,
      exits,
      officeDurationSeconds: Math.round(officeDurationSeconds),
      pc: {
        activeSeconds: Math.round(activeSeconds),
        idleSeconds: Math.round(idleSeconds),
        breakSeconds: Math.round(breakSeconds),
      },
      breaks,
    };
  }

  async computerDayReport(computerId: string, dateStr: string) {
    const comp = await this.compRepo.findOne({
      where: { id: computerId },
      relations: ['employee', 'room'],
    });
    if (!comp) throw new NotFoundException('Computer not found');
    const dayStart = new Date(dateStr + 'T00:00:00.000Z');
    const dayEnd = new Date(dateStr + 'T23:59:59.999Z');
    const events = await this.activityRepo.find({
      where: { computerId, createdAt: Between(dayStart, dayEnd) },
      order: { createdAt: 'ASC' },
      take: 500,
    });
    const byStatus = { working: 0, idle: 0, break: 0 };
    for (const e of events) {
      if (e.status === ActivityStatus.WORKING) byStatus.working++;
      else if (e.status === ActivityStatus.IDLE) byStatus.idle++;
      else if (e.status === ActivityStatus.BREAK) byStatus.break++;
    }
    return {
      computer: {
        id: comp.id,
        name: comp.name,
        macAddress: comp.macAddress,
        lastSeenAt: comp.lastSeenAt ? comp.lastSeenAt.toISOString() : null,
      },
      employee: comp.employee
        ? { id: comp.employee.id, fullName: comp.employee.fullName }
        : null,
      room: comp.room ? { id: comp.room.id, name: comp.room.name } : null,
      date: dateStr,
      totalEvents: events.length,
      byStatus,
      samples: events.slice(-80).map((e) => ({
        at: e.createdAt.toISOString(),
        status: e.status,
      })),
    };
  }

  async employeesActivitySummary() {
    const rows = await this.activityRepo.manager.query<
      {
        employeeId: string;
        recordsCount: string;
        lastActivityAt: Date | null;
      }[]
    >(
      `
      SELECT e.id::text AS "employeeId",
             COUNT(a.id)::text AS "recordsCount",
             MAX(a.created_at) AS "lastActivityAt"
      FROM employees e
      LEFT JOIN computers c ON c.employee_id = e.id
      LEFT JOIN activity_events a ON a.computer_id = c.id
      GROUP BY e.id
      `,
    );
    return rows.map((r) => ({
      employeeId: r.employeeId,
      recordsCount: Number(r.recordsCount) || 0,
      lastActivityAt: r.lastActivityAt
        ? new Date(r.lastActivityAt).toISOString()
        : null,
    }));
  }
}
