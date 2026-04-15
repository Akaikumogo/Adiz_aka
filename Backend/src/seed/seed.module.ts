import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserEntity } from '../database/entities/user.entity'
import { SeedService } from './seed.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), AuthModule],
  providers: [SeedService],
})
export class SeedModule {}
