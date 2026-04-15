import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { RoomEntity } from '../database/entities/room.entity'

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(RoomEntity)
    private readonly repo: Repository<RoomEntity>,
  ) {}

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } })
  }

  async findOne(id: string) {
    const r = await this.repo.findOne({ where: { id } })
    if (!r) throw new NotFoundException()
    return r
  }

  create(data: { name: string; code?: string | null; description?: string | null }) {
    return this.repo.save(this.repo.create(data))
  }

  async update(id: string, data: Partial<RoomEntity>) {
    const r = await this.findOne(id)
    Object.assign(r, data)
    return this.repo.save(r)
  }

  async remove(id: string) {
    await this.repo.delete(id)
    return { ok: true }
  }
}
