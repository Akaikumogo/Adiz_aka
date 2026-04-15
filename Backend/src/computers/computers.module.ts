import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ComputerEntity } from '../database/entities/computer.entity'
import { ComputersService } from './computers.service'
import { ComputersController } from './computers.controller'

@Module({
  imports: [TypeOrmModule.forFeature([ComputerEntity])],
  controllers: [ComputersController],
  providers: [ComputersService],
  exports: [ComputersService],
})
export class ComputersModule {}
