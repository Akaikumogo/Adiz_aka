import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserEntity } from '../database/entities/user.entity'
import { Role } from '../common/enums/role.enum'

export interface JwtPayload {
  sub: string
  email: string
  role: Role
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<UserEntity | null> {
    const user = await this.usersRepo.findOne({ where: { email: email.toLowerCase().trim() } })
    if (!user?.isActive) return null
    const ok = await bcrypt.compare(password, user.passwordHash)
    return ok ? user : null
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password)
    if (!user) throw new UnauthorizedException('Invalid credentials')
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as Role,
    }
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    }
  }

  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, 12)
  }
}
