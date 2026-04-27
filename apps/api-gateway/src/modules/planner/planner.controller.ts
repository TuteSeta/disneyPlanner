import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { PlannerService } from './planner.service';

@Controller('plan')
@UseGuards(ApiKeyGuard)
export class PlannerController {
  constructor(private readonly plannerService: PlannerService) {}

  @Post()
  @Throttle({ plan: { ttl: 60000, limit: 10 } })
  plan(@Body() body: { description: string }) {
    return this.plannerService.plan(body.description);
  }
}
