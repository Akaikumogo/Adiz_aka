import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common'
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator'
import { TurnstileService } from './turnstile.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { Role } from '../common/enums/role.enum'
class DeviceDto {
  @IsString()
  @MinLength(1)
  ip: string

  @IsIn(['in', 'out'])
  direction: 'in' | 'out'

  @IsOptional()
  @IsString()
  name?: string
}

@Controller('turnstile/devices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN, Role.ADMIN)
export class TurnstileDevicesController {
  constructor(private readonly svc: TurnstileService) {}

  @Get()
  list() {
    return this.svc.listDevices()
  }

  @Post()
  create(@Body() dto: DeviceDto) {
    return this.svc.createDevice({
      ip: dto.ip,
      direction: dto.direction,
      name: dto.name ?? null,
    })
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.removeDevice(id)
  }
}
