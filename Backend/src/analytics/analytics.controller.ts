import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { IsOptional, IsString, Matches } from 'class-validator'
import { AnalyticsService } from './analytics.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { Role } from '../common/enums/role.enum'

class QueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string

  @IsOptional()
  @IsString()
  search?: string
}

class AttendanceQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string
}

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPERADMIN, Role.ADMIN)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('summary')
  summary(@Query() q: QueryDto) {
    const to = q.to ? new Date(q.to + 'T23:59:59.999Z') : new Date()
    const from = q.from ? new Date(q.from + 'T00:00:00.000Z') : new Date(to.getTime() - 7 * 86400000)
    return this.analytics.summary(from, to)
  }

  @Get('efficiency-trend')
  efficiencyTrend(@Query() q: QueryDto) {
    const to = q.to ? new Date(q.to + 'T23:59:59.999Z') : new Date()
    const from = q.from ? new Date(q.from + 'T00:00:00.000Z') : new Date(to.getTime() - 7 * 86400000)
    return this.analytics.efficiencyTrend(from, to)
  }

  @Get('daily-records')
  dailyRecords(@Query() q: QueryDto) {
    const to = q.to ?? new Date().toISOString().slice(0, 10)
    const from = q.from ?? new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
    return this.analytics.dailyRecordsForUi(from, to, q.search)
  }

  @Get('kpis')
  kpis(@Query() q: QueryDto) {
    const to = q.to ?? new Date().toISOString().slice(0, 10)
    const from = q.from ?? new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
    return this.analytics.kpis(from, to)
  }

  @Get('efficiency-by-employee')
  effByEmp() {
    return this.analytics.efficiencyByEmployee()
  }

  @Get('efficiency-by-department')
  effByDept() {
    return this.analytics.efficiencyByDepartment()
  }

  @Get('access-turnstile')
  accessTurnstile(@Query() q: QueryDto) {
    const to = q.to ?? new Date().toISOString().slice(0, 10)
    const from = q.from ?? new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
    return this.analytics.accessTurnstileSummary(from, to)
  }

  @Get('attendance')
  attendance(@Query() q: AttendanceQueryDto) {
    const d = q.date ?? new Date().toISOString().slice(0, 10)
    return this.analytics.attendanceForDate(d)
  }
}
