import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TurnstileDeviceEntity, TurnstileDirection } from '../database/entities/turnstile-device.entity'
import { AccessEventEntity, AccessEventType } from '../database/entities/access-event.entity'
import { EmployeesService } from '../employees/employees.service'
import { RealtimeGateway } from '../realtime/realtime.gateway'
import { normalizeIp } from '../common/utils/ip'

@Injectable()
export class TurnstileService {
  constructor(
    @InjectRepository(TurnstileDeviceEntity)
    private readonly devicesRepo: Repository<TurnstileDeviceEntity>,
    @InjectRepository(AccessEventEntity)
    private readonly accessRepo: Repository<AccessEventEntity>,
    private readonly employees: EmployeesService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async listDevices() {
    return this.devicesRepo.find({ order: { ip: 'ASC' } })
  }

  async createDevice(data: {
    ip: string
    direction: TurnstileDirection
    name?: string | null
  }) {
    const ip = normalizeIp(data.ip)
    return this.devicesRepo.save(
      this.devicesRepo.create({ ...data, ip }),
    )
  }

  async removeDevice(id: string) {
    await this.devicesRepo.delete(id)
    return { ok: true }
  }

  async recordIngestEvent(data: {
    deviceIp: string
    cardId: string
    timestamp: string
    eventType?: AccessEventType | string
    fullName?: string | null
  }) {
    const ip = normalizeIp(data.deviceIp)
    const device = await this.devicesRepo.findOne({ where: { ip } })
    if (!device) throw new NotFoundException('Unknown device IP')
    let eventType: AccessEventType
    if (data.eventType === 'entry' || data.eventType === 'exit') {
      eventType = data.eventType
    } else {
      eventType = device.direction === 'in' ? 'entry' : 'exit'
    }
    const employee = await this.employees.findOrCreateByCardId(
      data.cardId,
      data.fullName,
    )
    const ts = new Date(data.timestamp)
    const ev = await this.accessRepo.save(
      this.accessRepo.create({
        employeeId: employee.id,
        deviceId: device.id,
        timestamp: ts,
        eventType,
        rawCardId: data.cardId.trim(),
      }),
    )
    this.realtime.emitAccessEvent({
      id: ev.id,
      employeeId: ev.employeeId,
      deviceId: ev.deviceId,
      timestamp: ts.toISOString(),
      eventType: ev.eventType,
    })
    this.realtime.emitDashboardRefresh()
    return ev
  }

  async listAccessEvents(query: {
    from?: string
    to?: string
    employeeId?: string
    eventType?: AccessEventType
  }) {
    const qb = this.accessRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.employee', 'e')
      .leftJoinAndSelect('a.device', 'd')
      .orderBy('a.timestamp', 'DESC')
      .take(1000)
    if (query.from) qb.andWhere('a.timestamp >= :f', { f: new Date(query.from) })
    if (query.to) qb.andWhere('a.timestamp <= :t', { t: new Date(query.to) })
    if (query.employeeId) qb.andWhere('a.employeeId = :eid', { eid: query.employeeId })
    if (query.eventType) qb.andWhere('a.eventType = :et', { et: query.eventType })
    return qb.getMany()
  }

  async createAccessEvent(data: {
    employeeId: string
    deviceId?: string | null
    deviceIp?: string | null
    timestamp: string
    eventType: AccessEventType
    rawCardId?: string | null
  }) {
    let deviceId: string | null = data.deviceId ?? null
    if (!deviceId && data.deviceIp?.trim()) {
      const d = await this.devicesRepo.findOne({ where: { ip: normalizeIp(data.deviceIp) } })
      if (!d) throw new NotFoundException('Unknown device IP')
      deviceId = d.id
    }
    const ev = await this.accessRepo.save(
      this.accessRepo.create({
        employeeId: data.employeeId,
        deviceId,
        timestamp: new Date(data.timestamp),
        eventType: data.eventType,
        rawCardId: data.rawCardId?.trim() || null,
      }),
    )
    this.realtime.emitDashboardRefresh()
    return ev
  }

  async updateAccessEvent(
    id: string,
    data: Partial<{
      employeeId: string | null
      deviceId: string | null
      deviceIp: string | null
      timestamp: string
      eventType: AccessEventType
      rawCardId: string | null
    }>,
  ) {
    const ev = await this.accessRepo.findOne({ where: { id } })
    if (!ev) throw new NotFoundException('Access event not found')
    if (data.employeeId !== undefined) ev.employeeId = data.employeeId
    if (data.deviceId !== undefined) ev.deviceId = data.deviceId
    if (data.deviceIp !== undefined) {
      if (!data.deviceIp) ev.deviceId = null
      else {
        const d = await this.devicesRepo.findOne({ where: { ip: normalizeIp(data.deviceIp) } })
        if (!d) throw new NotFoundException('Unknown device IP')
        ev.deviceId = d.id
      }
    }
    if (data.timestamp !== undefined) ev.timestamp = new Date(data.timestamp)
    if (data.eventType !== undefined) ev.eventType = data.eventType
    if (data.rawCardId !== undefined) ev.rawCardId = data.rawCardId?.trim() || null
    const saved = await this.accessRepo.save(ev)
    this.realtime.emitDashboardRefresh()
    return saved
  }

  async removeAccessEvent(id: string) {
    await this.accessRepo.delete(id)
    this.realtime.emitDashboardRefresh()
    return { ok: true }
  }
}
