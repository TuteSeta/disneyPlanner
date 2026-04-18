import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AiService } from './ai.service';
import { EnrichScheduleDto } from './dto/enrich-schedule.dto';
import { PlanTripDto } from './dto/plan-trip.dto';

@Controller()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @MessagePattern('enrich_schedule')
  enrichSchedule(@Payload() dto: EnrichScheduleDto) {
    return this.aiService.enrichSchedule(dto);
  }

  @MessagePattern('plan_trip')
  planTrip(@Payload() dto: PlanTripDto) {
    return this.aiService.planTrip(dto);
  }
}
