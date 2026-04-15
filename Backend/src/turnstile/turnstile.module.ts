import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TurnstileDeviceEntity } from '../database/entities/turnstile-device.entity'
import { AccessEventEntity } from '../database/entities/access-event.entity'
import { TurnstileService } from './turnstile.service'
import { TurnstileSeedService } from './turnstile-seed.service'
import { TurnstileDevicesController } from './turnstile-devices.controller'
import { TurnstileInternalController } from './turnstile-internal.controller'
import { InternalApiKeyGuard } from './internal-api-key.guard'
import { EmployeesModule } from '../employees/employees.module'
import { RealtimeModule } from '../realtime/realtime.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([TurnstileDeviceEntity, AccessEventEntity]),
    EmployeesModule,
    RealtimeModule,
  ],
  controllers: [TurnstileDevicesController, TurnstileInternalController],
  providers: [TurnstileService, TurnstileSeedService, InternalApiKeyGuard],
  exports: [TurnstileService],
})
export class TurnstileModule {}
