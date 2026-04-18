import { Injectable } from '@nestjs/common';
import { DURATION_ESTIMATES } from '../../constants';
import { ParkAttraction, RankedAttraction, SchedulePreferences } from '../types/pipeline.types';

@Injectable()
export class ActivityRankerStep {
  execute(attractions: ParkAttraction[], preferences: SchedulePreferences): RankedAttraction[] {
    return attractions
      .map((a) => ({
        ...a,
        score: this.score(a, preferences),
        estimatedDuration: this.duration(a),
      }))
      .sort((a, b) => b.score - a.score);
  }

  private score(attraction: ParkAttraction, preferences: SchedulePreferences): number {
    let score = 50;

    const isPriority = preferences.priorityAttractions.some((p) =>
      attraction.name.toLowerCase().includes(p.toLowerCase()),
    );
    if (isPriority) score += 50;

    if (attraction.waitTime >= 60) score += 20;
    else if (attraction.waitTime >= 30) score += 10;

    return score;
  }

  private duration(attraction: ParkAttraction): number {
    const base = DURATION_ESTIMATES[attraction.entityType] ?? 20;
    return base + Math.min(attraction.waitTime, 30);
  }
}
