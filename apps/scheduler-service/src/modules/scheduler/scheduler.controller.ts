import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SchedulerService } from './scheduler.service';
import { GenerateScheduleDto } from './dto/generate-schedule.dto';

@Controller()
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @MessagePattern('generate_schedule')
  generateSchedule(@Payload() dto: GenerateScheduleDto) {
    return this.schedulerService.generateSchedule(dto);
  }

  @MessagePattern('get_available_parks')
  getAvailableParks() {
    return this.schedulerService.getAvailableParks();
  }
}
