import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AnalyticsService } from './analytics.service';

@Injectable()
export class AnalyticsCronService {
  private readonly log = new Logger(AnalyticsCronService.name);

  constructor(private readonly analytics: AnalyticsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async nightlyAggregate() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const forDate = d.toISOString().slice(0, 10);
    this.log.log(`Running daily aggregate for ${forDate}`);
    await this.analytics.runDailyAggregate(forDate);
  }
}
