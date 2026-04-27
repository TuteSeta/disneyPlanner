import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PlanCacheService } from './cache/plan-cache.service';

@Module({
  controllers: [AiController],
  providers: [AiService, PlanCacheService],
})
export class AiModule {}
