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
import { PositionsService } from './positions.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { Role } from '../common/enums/role.enum'

class PositionDto {
  @IsString()
  @MinLength(1)
  name: string

  @IsOptional()
  @IsString()
  code?: string

  @IsOptional()
  @IsString()
  description?: string
}

class UpdatePositionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string

  @IsOptional()
  @IsString()
  code?: string | null

  @IsOptional()
  @IsString()
  description?: string | null
}

@Controller('positions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN, Role.ADMIN)
export class PositionsController {
  constructor(private readonly svc: PositionsService) {}

  @Get()
  findAll() {
    return this.svc.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(id)
  }

  @Post()
  create(@Body() dto: PositionDto) {
    return this.svc.create({
      name: dto.name,
      code: dto.code ?? null,
      description: dto.description ?? null,
    })
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePositionDto) {
    return this.svc.update(id, {
      name: dto.name,
      code: dto.code,
      description: dto.description,
    })
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(id)
  }
}
