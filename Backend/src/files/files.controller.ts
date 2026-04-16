import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Response } from 'express'
import * as fs from 'fs/promises'
import * as path from 'path'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { Role } from '../common/enums/role.enum'

@Controller('files')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN, Role.ADMIN)
export class FilesController {
  constructor(private readonly config: ConfigService) {}

  @Get('snapshots/:name')
  async snapshot(@Param('name') name: string, @Res() res: Response) {
    if (!/^[a-f0-9-]{36}\.jpg$/i.test(name)) {
      throw new BadRequestException('Invalid snapshot name')
    }
    const dir = this.config.get<string>('SNAPSHOTS_DIR', 'uploads/snapshots')
    const fp = path.resolve(process.cwd(), dir, name)
    if (!fp.startsWith(path.resolve(process.cwd(), dir))) {
      throw new BadRequestException('Invalid path')
    }
    try {
      await fs.access(fp)
    } catch {
      throw new NotFoundException()
    }
    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 'private, max-age=3600')
    return res.sendFile(fp)
  }
}
