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
import { IsOptional, IsString, MinLength } from 'class-validator'
import { DepartmentsService } from './departments.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { Role } from '../common/enums/role.enum'

class CreateDeptDto {
  @IsString()
  @MinLength(1)
  name: string

  @IsOptional()
  @IsString()
  code?: string
}

@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN, Role.ADMIN)
export class DepartmentsController {
  constructor(private readonly svc: DepartmentsService) {}

  @Get()
  findAll() {
    return this.svc.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateDeptDto) {
    return this.svc.create({ name: dto.name, code: dto.code ?? null })
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateDeptDto>,
  ) {
    return this.svc.update(id, { name: dto.name, code: dto.code })
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(id)
  }
}
