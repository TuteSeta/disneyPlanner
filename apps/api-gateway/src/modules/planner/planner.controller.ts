import { Body, Controller, Post } from '@nestjs/common';
import { PlannerService } from './planner.service';

@Controller('plan')
export class PlannerController {
  constructor(private readonly plannerService: PlannerService) {}

  @Post()
  plan(@Body() body: { description: string }) {
    return this.plannerService.plan(body.description);
  }
}
