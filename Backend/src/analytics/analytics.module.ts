import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ActivityEventEntity } from '../database/entities/activity-event.entity'
import { EmployeeEntity } from '../database/entities/employee.entity'
import { ComputerEntity } from '../database/entities/computer.entity'
import { DailyAggregateEntity } from '../database/entities/daily-aggregate.entity'
import { DepartmentEntity } from '../database/entities/department.entity'
import { AnalyticsService } from './analytics.service'
import { AnalyticsController } from './analytics.controller'
import { AnalyticsCronService } from './analytics-cron.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ActivityEventEntity,
      EmployeeEntity,
      ComputerEntity,
      DailyAggregateEntity,
      DepartmentEntity,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsCronService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
