import { Injectable } from '@nestjs/common';
import { DURATION_ESTIMATES } from '../../constants';
import { ActivityDraft, ActivityGroupDraft, TimeBlockDraft } from '../types/pipeline.types';

@Injectable()
export class TimeSlotAssignerStep {
  execute(blocks: TimeBlockDraft[]): TimeBlockDraft[] {
    for (const block of blocks) {
      let cursor = this.toMinutes(block.startTime);

      for (const group of block.groups) {
        for (const activity of group.activities) {
          const duration = this.estimateDuration(activity);
          activity.startTime = this.toHHMM(cursor);
          activity.endTime = this.toHHMM(cursor + duration);
          cursor += duration + 5; // 5 min walking buffer
        }
      }
    }

    return blocks;
  }

  private estimateDuration(activity: ActivityDraft): number {
    return DURATION_ESTIMATES[activity.activityType] ?? 20;
  }

  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private toHHMM(minutes: number): string {
    const h = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}
