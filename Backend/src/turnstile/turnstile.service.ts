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
    eventType: AccessEventType
  }) {
    const ip = normalizeIp(data.deviceIp)
    const device = await this.devicesRepo.findOne({ where: { ip } })
    if (!device) throw new NotFoundException('Unknown device IP')
    const eventType: AccessEventType = device.direction === 'in' ? 'entry' : 'exit'
    const employee = await this.employees.findOrCreateByCardId(data.cardId)
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
}
