import { Module } from '@nestjs/common'
import { CameraService } from './camera.service'

@Module({
  providers: [CameraService],
  exports: [CameraService],
})
export class CameraModule {}
