import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ScheduleModule } from '@nestjs/schedule'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { SeedModule } from './seed/seed.module'
import { DepartmentsModule } from './departments/departments.module'
import { PositionsModule } from './positions/positions.module'
import { RoomsModule } from './rooms/rooms.module'
import { EmployeesModule } from './employees/employees.module'
import { ComputersModule } from './computers/computers.module'
import { ActivityModule } from './activity/activity.module'
import { TurnstileModule } from './turnstile/turnstile.module'
import { AnalyticsModule } from './analytics/analytics.module'
import { RealtimeModule } from './realtime/realtime.module'
import { NvrModule } from './nvr/nvr.module'
import { AppTrackingModule } from './app-tracking/app-tracking.module'
import { FilesModule } from './files/files.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL', 'postgres://postgres:postgres@localhost:5432/workpulse'),
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV', 'development') !== 'production',
        logging: config.get<string>('TYPEORM_LOGGING') === 'true',
      }),
    }),
    AuthModule,
    UsersModule,
    SeedModule,
    DepartmentsModule,
    PositionsModule,
    RoomsModule,
    EmployeesModule,
    ComputersModule,
    RealtimeModule,
    ActivityModule,
    TurnstileModule,
    AnalyticsModule,
    NvrModule,
    AppTrackingModule,
    FilesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
