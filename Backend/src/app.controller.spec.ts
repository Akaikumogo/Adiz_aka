import { Test, TestingModule } from '@nestjs/testing'
import { AppController } from './app.controller'
import { AppService } from './app.service'

describe('AppController', () => {
  let appController: AppController

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile()

    appController = app.get<AppController>(AppController)
  })

  describe('health', () => {
    it('should return status ok', () => {
      const h = appController.health()
      expect(h).toMatchObject({ status: 'ok' })
      expect(typeof (h as { ts: string }).ts).toBe('string')
    })
  })
})
