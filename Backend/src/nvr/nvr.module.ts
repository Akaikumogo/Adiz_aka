import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { NvrClipEntity } from '../database/entities/nvr-clip.entity'
import { NvrController } from './nvr.controller'

@Module({
  imports: [TypeOrmModule.forFeature([NvrClipEntity])],
  controllers: [NvrController],
})
export class NvrModule {}
