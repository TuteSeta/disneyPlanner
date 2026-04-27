import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { PipelineService } from './pipeline/pipeline.service';
import { ParksService } from './parks/parks.service';
import { GenerateScheduleDto } from './dto/generate-schedule.dto';
import { TRIP_SERVICE } from './constants';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly pipeline: PipelineService,
    private readonly parksService: ParksService,
    @Inject(TRIP_SERVICE) private readonly tripClient: ClientProxy,
  ) {}

  getAvailableParks() {
    return this.parksService.getAllAvailableParks();
  }

  async generateSchedule(dto: GenerateScheduleDto) {
    const context = {
      tripId: dto.tripId,
      destinationSlug: dto.destinationSlug ?? 'waltdisneyworldresort',
      days: dto.days.map((d) => ({
        dayId: d.dayId,
        dayType: d.dayType,
        parkId: d.parkId,
      })),
      preferences: {
        intensity: dto.preferences.intensity,
        priorityAttractions: dto.preferences.priorityAttractions ?? [],
        hasKids: dto.preferences.hasKids ?? false,
        budget: dto.preferences.budget ?? 'medium',
      },
    };

    const schedule = await this.pipeline.execute(context);

    this.logger.log(`Saving schedule for trip ${dto.tripId} to trip-service`);
    await firstValueFrom(this.tripClient.send('save_schedule', schedule));

    return { tripId: dto.tripId, message: 'Schedule generated and saved successfully.' };
  }
}
