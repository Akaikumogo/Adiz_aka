import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { IsISO8601, IsOptional, IsString, IsUUID, MinLength } from 'class-validator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { Role } from '../common/enums/role.enum'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { NvrClipEntity } from '../database/entities/nvr-clip.entity'

class RegisterClipDto {
  @IsUUID()
  roomId: string

  @IsOptional()
  @IsUUID()
  employeeId?: string

  @IsString()
  @MinLength(1)
  storageUrl: string

  @IsISO8601()
  startedAt: string

  @IsOptional()
  @IsISO8601()
  endedAt?: string

  @IsOptional()
  @IsString()
  reason?: string
}

@Controller('nvr')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN, Role.ADMIN)
export class NvrController {
  constructor(
    @InjectRepository(NvrClipEntity)
    private readonly repo: Repository<NvrClipEntity>,
  ) {}

  @Get('clips')
  list() {
    return this.repo.find({ order: { createdAt: 'DESC' }, take: 100 })
  }

  @Post('clips')
  register(@Body() dto: RegisterClipDto) {
    return this.repo.save(
      this.repo.create({
        roomId: dto.roomId,
        employeeId: dto.employeeId ?? null,
        storageUrl: dto.storageUrl,
        startedAt: new Date(dto.startedAt),
        endedAt: dto.endedAt ? new Date(dto.endedAt) : null,
        reason: dto.reason ?? 'idle',
      }),
    )
  }
}
