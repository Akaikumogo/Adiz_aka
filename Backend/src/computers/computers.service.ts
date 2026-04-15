import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ComputerEntity } from '../database/entities/computer.entity'
import { generateMachineToken, sha256Hex } from '../common/utils/hash'

@Injectable()
export class ComputersService {
  constructor(
    @InjectRepository(ComputerEntity)
    private readonly repo: Repository<ComputerEntity>,
  ) {}

  findAll() {
    return this.repo.find({
      relations: ['employee', 'room'],
      order: { name: 'ASC' },
    })
  }

  async findOne(id: string) {
    const c = await this.repo.findOne({
      where: { id },
      relations: ['employee', 'room'],
    })
    if (!c) throw new NotFoundException()
    return c
  }

  async findByMac(mac: string) {
    const normalized = mac.toUpperCase().replace(/[:-]/g, '')
    return this.repo.findOne({
      where: { macAddress: normalized },
      relations: ['employee', 'room'],
    })
  }

  /** Returns machineToken only once at creation */
  async create(data: {
    macAddress: string
    name: string
    employeeId?: string | null
    roomId?: string | null
  }): Promise<{ computer: ComputerEntity; machineToken: string }> {
    const macAddress = data.macAddress.toUpperCase().replace(/[:-]/g, '')
    const dup = await this.repo.findOne({ where: { macAddress } })
    if (dup) throw new ConflictException('MAC already registered')
    const machineToken = generateMachineToken()
    const machineTokenHash = sha256Hex(machineToken)
    const computer = await this.repo.save(
      this.repo.create({
        macAddress,
        name: data.name,
        employeeId: data.employeeId ?? null,
        roomId: data.roomId ?? null,
        machineTokenHash,
      }),
    )
    return { computer, machineToken }
  }

  async update(
    id: string,
    data: Partial<{ name: string; employeeId: string | null; roomId: string | null }>,
  ) {
    const c = await this.findOne(id)
    Object.assign(c, data)
    return this.repo.save(c)
  }

  async remove(id: string) {
    await this.repo.delete(id)
    return { ok: true }
  }

  async rotateToken(id: string): Promise<{ machineToken: string }> {
    const c = await this.findOne(id)
    const machineToken = generateMachineToken()
    c.machineTokenHash = sha256Hex(machineToken)
    await this.repo.save(c)
    return { machineToken }
  }

  validateMachineToken(plain: string): Promise<ComputerEntity | null> {
    const hash = sha256Hex(plain)
    return this.repo.findOne({
      where: { machineTokenHash: hash },
      relations: ['employee', 'room'],
    })
  }
}
