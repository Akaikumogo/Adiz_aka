import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PositionEntity } from '../database/entities/position.entity'

export interface PositionInput {
  name: string
  code?: string | null
  description?: string | null
}

@Injectable()
export class PositionsService {
  constructor(
    @InjectRepository(PositionEntity)
    private readonly repo: Repository<PositionEntity>,
  ) {}

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } })
  }

  async findOne(id: string) {
    const e = await this.repo.findOne({ where: { id } })
    if (!e) throw new NotFoundException()
    return e
  }

  create(data: PositionInput) {
    return this.repo.save(
      this.repo.create({
        name: data.name,
        code: data.code ?? null,
        description: data.description ?? null,
      }),
    )
  }

  async update(id: string, data: Partial<PositionInput>) {
    const e = await this.findOne(id)
    Object.assign(e, data)
    return this.repo.save(e)
  }

  async remove(id: string) {
    await this.repo.delete(id)
    return { ok: true }
  }
}
