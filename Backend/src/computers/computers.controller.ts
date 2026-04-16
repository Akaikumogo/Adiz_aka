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
} from '@nestjs/common';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { ComputersService } from './computers.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

class CreateComputerDto {
  @IsString()
  @MinLength(1)
  macAddress: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsUUID()
  roomId?: string;
}

@Controller('computers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN, Role.ADMIN)
export class ComputersController {
  constructor(private readonly svc: ComputersService) {}

  @Get()
  findAll() {
    return this.svc.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateComputerDto) {
    const { computer, machineToken } = await this.svc.create({
      macAddress: dto.macAddress,
      name: dto.name,
      employeeId: dto.employeeId ?? null,
      roomId: dto.roomId ?? null,
    });
    return {
      id: computer.id,
      macAddress: computer.macAddress,
      name: computer.name,
      machineToken,
      warning: 'Save machineToken securely — it is shown only once',
    };
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    dto: Partial<Pick<CreateComputerDto, 'name' | 'employeeId' | 'roomId'>>,
  ) {
    return this.svc.update(id, {
      name: dto.name,
      employeeId: dto.employeeId ?? undefined,
      roomId: dto.roomId ?? undefined,
    });
  }

  @Post(':id/rotate-token')
  async rotateToken(@Param('id', ParseUUIDPipe) id: string) {
    const { machineToken } = await this.svc.rotateToken(id);
    return { machineToken, warning: 'Shown only once' };
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(id);
  }
}
