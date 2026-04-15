import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between, Not, IsNull } from 'typeorm'
import { ActivityEventEntity } from '../database/entities/activity-event.entity'
import { EmployeeEntity } from '../database/entities/employee.entity'
import { ComputerEntity } from '../database/entities/computer.entity'
import { DailyAggregateEntity } from '../database/entities/daily-aggregate.entity'
import { DepartmentEntity } from '../database/entities/department.entity'
import { ActivityStatus } from '../common/enums/activity-status.enum'

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
  ) {}

  async summary(from: Date, to: Date) {
    const empCount = await this.empRepo.count({
      where: { isActive: true, departmentId: Not(IsNull()) },
    })
    const activeComputers = await this.activityRepo
      .createQueryBuilder('a')
      .select('COUNT(DISTINCT a.computerId)', 'cnt')
      .where('a.createdAt BETWEEN :from AND :to', { from, to })
      .getRawOne<{ cnt: string }>()
    const totalEvents = await this.activityRepo.count({
      where: { createdAt: Between(from, to) },
    })
    const avgRow = await this.dailyRepo
      .createQueryBuilder('d')
      .innerJoin(EmployeeEntity, 'e', 'e.id = d.employeeId')
      .select('AVG(d.avgEfficiency)', 'avg')
      .where('d.date BETWEEN :f AND :t', {
        f: from.toISOString().slice(0, 10),
        t: to.toISOString().slice(0, 10),
      })
      .andWhere('e.departmentId IS NOT NULL')
      .getRawOne<{ avg: string }>()
    const sumMin = await this.dailyRepo
      .createQueryBuilder('d')
      .innerJoin(EmployeeEntity, 'e', 'e.id = d.employeeId')
      .select('SUM(d.activeMinutes)', 's')
      .where('d.date BETWEEN :f AND :t', {
        f: from.toISOString().slice(0, 10),
        t: to.toISOString().slice(0, 10),
      })
      .andWhere('e.departmentId IS NOT NULL')
      .getRawOne<{ s: string }>()
    return {
      totalEmployees: empCount,
      activeComputersInRange: Number(activeComputers?.cnt ?? 0),
      totalActivityEvents: totalEvents,
      avgEfficiency: Math.round(Number(avgRow?.avg) || 0),
      totalActiveMinutes: Number(sumMin?.s) || 0,
      from: from.toISOString(),
      to: to.toISOString(),
    }
  }

  async kpis(from: string, to: string) {
    const start = new Date(from + 'T00:00:00.000Z')
    const end = new Date(to + 'T23:59:59.999Z')
    const s = await this.summary(start, end)
    const idleSum = await this.dailyRepo
      .createQueryBuilder('d')
      .innerJoin(EmployeeEntity, 'e', 'e.id = d.employeeId')
      .select('SUM(d.idleMinutes)', 's')
      .where('d.date BETWEEN :f AND :t', { f: from, t: to })
      .andWhere('e.departmentId IS NOT NULL')
      .getRawOne<{ s: string }>()
    const today = new Date().toISOString().slice(0, 10)
    const activeToday = await this.activityRepo
      .createQueryBuilder('a')
      .select('COUNT(DISTINCT c.employeeId)', 'cnt')
      .innerJoin('a.computer', 'c')
      .innerJoin('c.employee', 'emp')
      .where('a.createdAt >= :d', { d: new Date(today + 'T00:00:00.000Z') })
      .andWhere('emp.departmentId IS NOT NULL')
      .getRawOne<{ cnt: string }>()
    return {
      totalEmployees: s.totalEmployees,
      activeToday: Number(activeToday?.cnt ?? 0),
      avgEfficiency: s.avgEfficiency,
      totalActiveMinutes: s.totalActiveMinutes,
      totalIdleMinutes: Number(idleSum?.s) || 0,
    }
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
      .groupBy('d.date')
      .orderBy('d.date', 'ASC')
      .getRawMany<{ date: string; avgEfficiency: string }>()
    return rows.map((r) => ({
      date: r.date,
      label: r.date.slice(8, 10) + '.' + r.date.slice(5, 7),
      avgEfficiency: Math.round(Number(r.avgEfficiency) || 0),
    }))
  }

  async dailyRecordsForUi(from: string, to: string, search?: string) {
    const start = new Date(from + 'T00:00:00.000Z')
    const end = new Date(to + 'T23:59:59.999Z')
    const qb = this.activityRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.computer', 'c')
      .leftJoinAndSelect('c.employee', 'e')
      .where('a.createdAt BETWEEN :start AND :end', { start, end })
    if (search?.trim()) {
      qb.andWhere('(e.fullName ILIKE :q OR c.name ILIKE :q)', {
        q: `%${search.trim()}%`,
      })
    }
    qb.andWhere('(e.id IS NULL OR e.departmentId IS NOT NULL)')
    qb.orderBy('a.createdAt', 'DESC').take(500)
    const events = await qb.getMany()
    return events.map((ev) => this.mapActivityToUiRow(ev))
  }

  private mapActivityToUiRow(ev: ActivityEventEntity) {
    const emp = ev.computer?.employee
    const d = ev.createdAt
    const dateStr = d.toISOString().slice(0, 10)
    const tsNum = Number(ev.timestamp)
    const eff =
      ev.status === ActivityStatus.WORKING
        ? 85
        : ev.status === ActivityStatus.IDLE
          ? 45
          : 30
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
    }
  }

  async efficiencyByEmployee() {
    const emps = await this.empRepo.find({
      where: { isActive: true, departmentId: Not(IsNull()) },
    })
    const out: { employeeId: string; name: string; avgEfficiency: number }[] = []
    for (const e of emps) {
      const row = await this.dailyRepo
        .createQueryBuilder('d')
        .select('AVG(d.avgEfficiency)', 'avg')
        .where('d.employeeId = :id', { id: e.id })
        .getRawOne<{ avg: string }>()
      out.push({
        employeeId: e.id,
        name: e.fullName.split(/\s+/)[0] ?? e.fullName,
        avgEfficiency: Math.round(Number(row?.avg) || 0),
      })
    }
    return out
  }

  async efficiencyByDepartment() {
    const depts = await this.deptRepo.find()
    const out: { department: string; avgEfficiency: number }[] = []
    for (const d of depts) {
      const emps = await this.empRepo.find({ where: { departmentId: d.id } })
      let sum = 0
      let n = 0
      for (const e of emps) {
        const row = await this.dailyRepo
          .createQueryBuilder('x')
          .select('AVG(x.avgEfficiency)', 'avg')
          .where('x.employeeId = :id', { id: e.id })
          .getRawOne<{ avg: string }>()
        if (row?.avg != null && !Number.isNaN(Number(row.avg))) {
          sum += Number(row.avg)
          n += 1
        }
      }
      out.push({
        department: d.name,
        avgEfficiency: n ? Math.round(sum / n) : 0,
      })
    }
    return out
  }

  async runDailyAggregate(forDate: string) {
    const start = new Date(forDate + 'T00:00:00.000Z')
    const end = new Date(forDate + 'T23:59:59.999Z')
    await this.dailyRepo.delete({ date: forDate })
    const emps = await this.empRepo.find({
      where: { isActive: true, departmentId: Not(IsNull()) },
    })
    for (const emp of emps) {
      const computers = await this.compRepo.find({ where: { employeeId: emp.id } })
      let active = 0
      let idle = 0
      let brk = 0
      for (const c of computers) {
        const evs = await this.activityRepo.find({
          where: {
            computerId: c.id,
            createdAt: Between(start, end),
          },
        })
        for (const e of evs) {
          if (e.status === ActivityStatus.WORKING) active += 1
          else if (e.status === ActivityStatus.IDLE) idle += 1
          else if (e.status === ActivityStatus.BREAK) brk += 1
        }
      }
      const total = active + idle + brk || 1
      const avgEff = Math.round((active / total) * 100)
      await this.dailyRepo.save(
        this.dailyRepo.create({
          date: forDate,
          employeeId: emp.id,
          activeMinutes: active * 10,
          idleMinutes: idle * 10,
          breakMinutes: brk * 10,
          avgEfficiency: avgEff,
        }),
      )
    }
  }
}
