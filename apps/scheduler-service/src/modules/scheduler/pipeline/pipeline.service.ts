import { Injectable, Logger } from '@nestjs/common';
import { DayInput, DaySchedule, GeneratedSchedule, SchedulePreferences } from './types/pipeline.types';
import { ActivityLoaderStep } from './steps/activity-loader.step';
import { ActivityRankerStep } from './steps/activity-ranker.step';
import { TimeBlockBuilderStep } from './steps/time-block-builder.step';
import { MiniGroupBuilderStep } from './steps/mini-group-builder.step';
import { TimeSlotAssignerStep } from './steps/time-slot-assigner.step';
import { ConflictResolverStep } from './steps/conflict-resolver.step';

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  constructor(
    private readonly activityLoader: ActivityLoaderStep,
    private readonly activityRanker: ActivityRankerStep,
    private readonly timeBlockBuilder: TimeBlockBuilderStep,
    private readonly miniGroupBuilder: MiniGroupBuilderStep,
    private readonly timeSlotAssigner: TimeSlotAssignerStep,
    private readonly conflictResolver: ConflictResolverStep,
  ) {}

  async execute(
    tripId: number,
    days: DayInput[],
    preferences: SchedulePreferences,
  ): Promise<GeneratedSchedule> {
    this.logger.log(`Starting pipeline for trip ${tripId} — ${days.length} days`);

    // Step 1 — Load attractions from ThemeParks.wiki
    const loadedDays = await this.activityLoader.execute(days);

    const scheduledDays: DaySchedule[] = [];

    for (const day of loadedDays) {
      this.logger.log(`Processing day ${day.dayId} — type=${day.dayType}, attractions=${day.attractions.length}`);

      if (day.dayType === 'REST' || day.dayType === 'SHOPPING') {
        scheduledDays.push({ dayId: day.dayId, dayType: day.dayType, timeBlocks: [] });
        continue;
      }

      // Step 2 — Rank attractions based on preferences
      const ranked = this.activityRanker.execute(day.attractions, preferences);

      // Step 3 — Build empty time block templates
      const blocks = this.timeBlockBuilder.execute();

      // Step 4 — Group by area and fill blocks
      const grouped = this.miniGroupBuilder.execute(blocks, ranked, preferences.intensity);

      // Step 5 — Assign HH:MM time slots
      const timed = this.timeSlotAssigner.execute(grouped);

      // Step 6 — Drop activities that overflow the block
      const resolved = this.conflictResolver.execute(timed);

      scheduledDays.push({ dayId: day.dayId, dayType: day.dayType, timeBlocks: resolved });
    }

    this.logger.log(`Pipeline complete for trip ${tripId}`);
    return { tripId, days: scheduledDays };
  }
}
