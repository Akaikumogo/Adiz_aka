import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { TurnstileDeviceEntity } from '../database/entities/turnstile-device.entity'
import { normalizeIp } from '../common/utils/ip'

@Injectable()
export class TurnstileSeedService implements OnModuleInit {
  private readonly log = new Logger(TurnstileSeedService.name)

  constructor(
    @InjectRepository(TurnstileDeviceEntity)
    private readonly devicesRepo: Repository<TurnstileDeviceEntity>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    const defIn = '192.168.30.2,192.168.30.3'
    const defOut = '192.168.30.4,192.168.30.5'
    const ipsIn = this.parseIps(this.config.get<string>('TURNSTILE_IPS_IN', defIn))
    const ipsOut = this.parseIps(this.config.get<string>('TURNSTILE_IPS_OUT', defOut))
    for (const ip of ipsIn) await this.upsert(ip, 'in')
    for (const ip of ipsOut) await this.upsert(ip, 'out')
    this.log.log(`Turnstile devices synced: ${ipsIn.length} in, ${ipsOut.length} out`)
  }

  private parseIps(raw: string): string[] {
    return raw
      .split(',')
      .map((s) => normalizeIp(s))
      .filter(Boolean)
  }

  private async upsert(ip: string, direction: 'in' | 'out') {
    const existing = await this.devicesRepo.findOne({ where: { ip } })
    if (existing) {
      if (existing.direction !== direction) {
        existing.direction = direction
        await this.devicesRepo.save(existing)
      }
      return
    }
    await this.devicesRepo.save(
      this.devicesRepo.create({
        ip,
        direction,
        name: direction === 'in' ? 'Kirish' : 'Chiqish',
        isActive: true,
      }),
    )
  }
}
