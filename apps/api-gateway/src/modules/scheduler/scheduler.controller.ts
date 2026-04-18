import { Body, Controller, Get, Post } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';

@Controller('schedule')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post()
  generateSchedule(@Body() body: unknown) {
    return this.schedulerService.generateSchedule(body);
  }

  @Get('parks')
  getOrlandoParks() {
    return this.schedulerService.getOrlandoParks();
  }
}
