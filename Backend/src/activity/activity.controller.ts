import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common'
import { Type } from 'class-transformer'
import { IsArray, IsEnum, IsNumber, IsOptional, IsObject, ValidateNested } from 'class-validator'
import { ActivityService } from './activity.service'
import { MachineAuthGuard } from './machine-auth.guard'
import { ActivityStatus } from '../common/enums/activity-status.enum'
import { ComputerEntity } from '../database/entities/computer.entity'

class ActivityItemDto {
  @IsNumber()
  timestamp: number

  @IsEnum(ActivityStatus)
  status: ActivityStatus

  @IsOptional()
  @IsObject()
  raw?: Record<string, unknown>
}

class ActivityBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityItemDto)
  events: ActivityItemDto[]
}

@Controller('activity')
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}

  @Post('batch')
  @UseGuards(MachineAuthGuard)
  async batch(
    @Body() dto: ActivityBatchDto,
    @Req() req: { computer: ComputerEntity },
  ) {
    return this.activity.ingestBatch(req.computer, dto.events)
  }
}
