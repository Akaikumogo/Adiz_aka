import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { IsBoolean, IsOptional, IsString, IsUUID, MinLength } from 'class-validator'
import { EmployeesService, EmployeeInput } from './employees.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { Role } from '../common/enums/role.enum'

class EmployeeDto implements EmployeeInput {
  @IsString()
  @MinLength(1)
  fullName: string

  @IsOptional()
  @IsString()
  avatarUrl?: string | null

  @IsOptional()
  @IsUUID()
  departmentId?: string | null

  @IsOptional()
  @IsString()
  position?: string

  @IsOptional()
  @IsString()
  cardId?: string | null

  @IsOptional()
  @IsUUID()
  roomId?: string | null

  @IsOptional()
  @IsString()
  workStart?: string

  @IsOptional()
  @IsString()
  workEnd?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

class AssignDto {
  @IsOptional()
  @IsUUID()
  departmentId?: string | null

  @IsOptional()
  @IsUUID()
  roomId?: string | null
}

class BulkAssignRoomDto {
  @IsUUID()
  departmentId: string

  @IsOptional()
  @IsUUID()
  roomId?: string | null
}

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN, Role.ADMIN)
export class EmployeesController {
  constructor(private readonly svc: EmployeesService) {}

  @Get()
  findAll() {
    return this.svc.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(id)
  }

  @Post()
  create(@Body() dto: EmployeeDto) {
    return this.svc.create(dto)
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Partial<EmployeeDto>) {
    return this.svc.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(id)
  }

  @Patch(':id/assign')
  assign(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignDto) {
    return this.svc.assign(id, {
      departmentId: dto.departmentId,
      roomId: dto.roomId,
    })
  }

  @Post('assign-room-by-department')
  bulkAssignRoom(@Body() dto: BulkAssignRoomDto) {
    return this.svc.bulkAssignRoomByDepartment(
      dto.departmentId,
      dto.roomId ?? null,
    )
  }
}
