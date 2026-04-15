import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserEntity } from '../database/entities/user.entity'
import { Role } from '../common/enums/role.enum'
import { AuthService } from '../auth/auth.service'
import { CreateAdminDto } from './dto/create-admin.dto'
import { UpdateAdminDto } from './dto/update-admin.dto'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
    private readonly auth: AuthService,
  ) {}

  async listAdmins(): Promise<UserEntity[]> {
    return this.repo.find({
      where: { role: Role.ADMIN },
      order: { createdAt: 'DESC' },
      select: ['id', 'email', 'role', 'isActive', 'createdAt', 'createdById'],
    })
  }

  async createAdmin(dto: CreateAdminDto, createdById: string): Promise<UserEntity> {
    const email = dto.email.toLowerCase().trim()
    const exists = await this.repo.findOne({ where: { email } })
    if (exists) throw new ConflictException('Email already registered')
    const passwordHash = await this.auth.hashPassword(dto.password)
    const user = this.repo.create({
      email,
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
      createdById,
    })
    return this.repo.save(user)
  }

  async updateAdmin(id: string, dto: UpdateAdminDto): Promise<UserEntity> {
    const user = await this.repo.findOne({ where: { id, role: Role.ADMIN } })
    if (!user) throw new NotFoundException('Admin not found')
    if (dto.password) user.passwordHash = await this.auth.hashPassword(dto.password)
    if (dto.isActive !== undefined) user.isActive = dto.isActive
    return this.repo.save(user)
  }
}
