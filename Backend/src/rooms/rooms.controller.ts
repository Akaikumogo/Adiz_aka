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
import { RoomsService } from './rooms.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { Role } from '../common/enums/role.enum'

class RoomDto {
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

@Controller('rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN, Role.ADMIN)
export class RoomsController {
  constructor(private readonly svc: RoomsService) {}

  @Get()
  findAll() {
    return this.svc.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(id)
  }

  @Post()
  create(@Body() dto: RoomDto) {
    return this.svc.create({
      name: dto.name,
      code: dto.code ?? null,
      description: dto.description ?? null,
    })
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Partial<RoomDto>) {
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
