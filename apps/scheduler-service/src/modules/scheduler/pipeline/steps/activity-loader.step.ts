import { Injectable, Logger } from '@nestjs/common';
import { ParksService } from '../../parks/parks.service';
import { DayInput, DayType, ParkAttraction } from '../types/pipeline.types';

export interface LoadedDay {
  dayId: number;
  dayType: DayType;
  attractions: ParkAttraction[];
}

@Injectable()
export class ActivityLoaderStep {
  private readonly logger = new Logger(ActivityLoaderStep.name);

  constructor(private readonly parksService: ParksService) {}

  async execute(days: DayInput[]): Promise<LoadedDay[]> {
    return Promise.all(days.map((day) => this.loadDay(day)));
  }

  private async loadDay(day: DayInput): Promise<LoadedDay> {
    if (day.dayType === 'REST' || day.dayType === 'SHOPPING') {
      this.logger.log(`Day ${day.dayId} is ${day.dayType} — skipping attraction load`);
      return { dayId: day.dayId, dayType: day.dayType, attractions: [] };
    }

    if (!day.parkId) {
      this.logger.warn(`Day ${day.dayId} is ${day.dayType} but has no parkId`);
      return { dayId: day.dayId, dayType: day.dayType, attractions: [] };
    }

    const attractions = await this.parksService.getAttractionsForPark(day.parkId);
    return { dayId: day.dayId, dayType: day.dayType, attractions };
  }
}
