import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ActivityEventEntity } from '../database/entities/activity-event.entity'
import { ComputerEntity } from '../database/entities/computer.entity'
import { ActivityService } from './activity.service'
import { ActivityController } from './activity.controller'
import { MachineAuthGuard } from './machine-auth.guard'
import { ComputersModule } from '../computers/computers.module'
import { RealtimeModule } from '../realtime/realtime.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([ActivityEventEntity, ComputerEntity]),
    ComputersModule,
    RealtimeModule,
  ],
  controllers: [ActivityController],
  providers: [ActivityService, MachineAuthGuard],
  exports: [ActivityService],
})
export class ActivityModule {}
