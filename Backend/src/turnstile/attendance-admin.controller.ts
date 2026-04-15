import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { Role } from '../common/enums/role.enum'
import { TurnstileService } from './turnstile.service'

class AccessEventQueryDto {
  @IsOptional()
  @IsString()
  from?: string

  @IsOptional()
  @IsString()
  to?: string

  @IsOptional()
  @IsUUID()
  employeeId?: string

  @IsOptional()
  @IsIn(['entry', 'exit'])
  eventType?: 'entry' | 'exit'
}

class AccessEventDto {
  @IsUUID()
  employeeId: string

  @IsOptional()
  @IsUUID()
  deviceId?: string | null

  @IsOptional()
  @IsString()
  @MinLength(7)
  deviceIp?: string | null

  @IsString()
  @MinLength(4)
  timestamp: string

  @IsIn(['entry', 'exit'])
  eventType: 'entry' | 'exit'

  @IsOptional()
  @IsString()
  rawCardId?: string | null
}

class UpdateAccessEventDto {
  @IsOptional()
  @IsUUID()
  employeeId?: string | null

  @IsOptional()
  @IsUUID()
  deviceId?: string | null

  @IsOptional()
  @IsString()
  @MinLength(7)
  deviceIp?: string | null

  @IsOptional()
  @IsString()
  @MinLength(4)
  timestamp?: string

  @IsOptional()
  @IsIn(['entry', 'exit'])
  eventType?: 'entry' | 'exit'

  @IsOptional()
  @IsString()
  rawCardId?: string | null
}

@Controller('attendance/events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN, Role.ADMIN)
export class AttendanceAdminController {
  constructor(private readonly svc: TurnstileService) {}

  @Get()
  list(@Query() q: AccessEventQueryDto) {
    return this.svc.listAccessEvents({
      from: q.from,
      to: q.to,
      employeeId: q.employeeId,
      eventType: q.eventType,
    })
  }

  @Post()
  create(@Body() dto: AccessEventDto) {
    return this.svc.createAccessEvent(dto)
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAccessEventDto,
  ) {
    return this.svc.updateAccessEvent(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.removeAccessEvent(id)
  }
}
