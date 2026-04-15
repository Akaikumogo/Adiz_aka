import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserEntity } from '../database/entities/user.entity'
import { Role } from '../common/enums/role.enum'
import { AuthService } from '../auth/auth.service'

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly log = new Logger(SeedService.name)

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly config: ConfigService,
    private readonly auth: AuthService,
  ) {}

  async onModuleInit() {
    await this.seedSuperAdmin()
  }

  private async seedSuperAdmin() {
    const email = this.config.get<string>('SUPERADMIN_EMAIL')?.toLowerCase().trim()
    const password = this.config.get<string>('SUPERADMIN_PASSWORD')
    if (!email || !password) {
      this.log.warn('SUPERADMIN_EMAIL or SUPERADMIN_PASSWORD not set — skipping superadmin seed')
      return
    }
    const exists = await this.usersRepo.findOne({ where: { email } })
    if (exists) {
      this.log.log('SuperAdmin already exists')
      return
    }
    const passwordHash = await this.auth.hashPassword(password)
    await this.usersRepo.save(
      this.usersRepo.create({
        email,
        passwordHash,
        role: Role.SUPERADMIN,
        isActive: true,
        createdById: null,
      }),
    )
    this.log.log(`SuperAdmin created: ${email}`)
  }
}
