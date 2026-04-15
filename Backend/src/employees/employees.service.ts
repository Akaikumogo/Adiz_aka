import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { EmployeeEntity } from '../database/entities/employee.entity'

export interface EmployeeInput {
  fullName: string
  avatarUrl?: string | null
  departmentId?: string | null
  position?: string
  cardId?: string | null
  roomId?: string | null
  workStart?: string
  workEnd?: string
  isActive?: boolean
}

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly repo: Repository<EmployeeEntity>,
  ) {}

  findAll() {
    return this.repo.find({
      relations: ['department', 'room'],
      order: { fullName: 'ASC' },
    })
  }

  async findOne(id: string) {
    const e = await this.repo.findOne({
      where: { id },
      relations: ['department', 'room'],
    })
    if (!e) throw new NotFoundException()
    return e
  }

  create(data: EmployeeInput) {
    return this.repo.save(
      this.repo.create({
        fullName: data.fullName,
        avatarUrl: data.avatarUrl ?? null,
        departmentId: data.departmentId ?? null,
        position: data.position ?? '',
        cardId: data.cardId ?? null,
        roomId: data.roomId ?? null,
        workStart: data.workStart ?? '09:00',
        workEnd: data.workEnd ?? '18:00',
        isActive: data.isActive ?? true,
      }),
    )
  }

  async update(id: string, data: Partial<EmployeeInput>) {
    const e = await this.findOne(id)
    Object.assign(e, data)
    return this.repo.save(e)
  }

  async remove(id: string) {
    await this.repo.delete(id)
    return { ok: true }
  }

  findByCardId(cardId: string) {
    const c = cardId.trim()
    return this.repo.findOne({ where: { cardId: c } })
  }

  async findOrCreateByCardId(cardId: string): Promise<EmployeeEntity> {
    const c = cardId.trim()
    const existing = await this.repo.findOne({ where: { cardId: c } })
    if (existing) return existing
    return this.repo.save(
      this.repo.create({
        fullName: `Karta ${c}`,
        departmentId: null,
        cardId: c,
        position: '',
        workStart: '09:00',
        workEnd: '18:00',
        isActive: true,
      }),
    )
  }
}
