import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppUsageEntity } from '../database/entities/app-usage.entity';
import { WebsiteVisitEntity } from '../database/entities/website-visit.entity';

class AppUsageDto {
  @IsUUID()
  computerId: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsISO8601()
  startedAt: string;

  @IsOptional()
  @IsISO8601()
  endedAt?: string;
}

class WebsiteDto {
  @IsUUID()
  computerId: string;

  @IsString()
  @MinLength(1)
  url: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsISO8601()
  visitedAt: string;
}

@Controller('tracking')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN, Role.ADMIN)
export class AppTrackingController {
  constructor(
    @InjectRepository(AppUsageEntity)
    private readonly apps: Repository<AppUsageEntity>,
    @InjectRepository(WebsiteVisitEntity)
    private readonly sites: Repository<WebsiteVisitEntity>,
  ) {}

  @Get('apps')
  listApps(@Query('computerId') computerId?: string) {
    const q = this.apps
      .createQueryBuilder('a')
      .orderBy('a.startedAt', 'DESC')
      .take(200);
    if (computerId) q.where('a.computerId = :id', { id: computerId });
    return q.getMany();
  }

  @Get('websites')
  listSites(@Query('computerId') computerId?: string) {
    const q = this.sites
      .createQueryBuilder('w')
      .orderBy('w.visitedAt', 'DESC')
      .take(200);
    if (computerId) q.where('w.computerId = :id', { id: computerId });
    return q.getMany();
  }

  @Post('apps')
  recordApp(@Body() dto: AppUsageDto) {
    return this.apps.save(
      this.apps.create({
        computerId: dto.computerId,
        name: dto.name,
        startedAt: new Date(dto.startedAt),
        endedAt: dto.endedAt ? new Date(dto.endedAt) : null,
      }),
    );
  }

  @Post('websites')
  recordSite(@Body() dto: WebsiteDto) {
    return this.sites.save(
      this.sites.create({
        computerId: dto.computerId,
        url: dto.url,
        title: dto.title ?? null,
        visitedAt: new Date(dto.visitedAt),
      }),
    );
  }
}
