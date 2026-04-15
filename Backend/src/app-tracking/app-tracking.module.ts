import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AppUsageEntity } from '../database/entities/app-usage.entity'
import { WebsiteVisitEntity } from '../database/entities/website-visit.entity'
import { AppTrackingController } from './app-tracking.controller'

@Module({
  imports: [TypeOrmModule.forFeature([AppUsageEntity, WebsiteVisitEntity])],
  controllers: [AppTrackingController],
})
export class AppTrackingModule {}
