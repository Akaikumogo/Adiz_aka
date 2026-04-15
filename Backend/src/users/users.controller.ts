import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { Role } from '../common/enums/role.enum'
import { CreateAdminDto } from './dto/create-admin.dto'
import { UpdateAdminDto } from './dto/update-admin.dto'

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('admins')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  listAdmins() {
    return this.users.listAdmins()
  }

  @Post('admins')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  createAdmin(@Body() dto: CreateAdminDto, @Req() req: { user: { userId: string } }) {
    return this.users.createAdmin(dto, req.user.userId)
  }

  @Patch('admins/:id')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  updateAdmin(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminDto,
  ) {
    return this.users.updateAdmin(id, dto)
  }

  @Delete('admins/:id')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  removeAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.removeAdmin(id)
  }
}
