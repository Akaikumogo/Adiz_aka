import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { DepartmentEntity } from '../database/entities/department.entity'

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(DepartmentEntity)
    private readonly repo: Repository<DepartmentEntity>,
  ) {}

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } })
  }

  async findOne(id: string) {
    const d = await this.repo.findOne({ where: { id } })
    if (!d) throw new NotFoundException()
    return d
  }

  create(data: { name: string; code?: string | null }) {
    return this.repo.save(this.repo.create(data))
  }

  async update(id: string, data: Partial<{ name: string; code: string | null }>) {
    const d = await this.findOne(id)
    Object.assign(d, data)
    return this.repo.save(d)
  }

  async remove(id: string) {
    await this.repo.delete(id)
    return { ok: true }
  }
}
