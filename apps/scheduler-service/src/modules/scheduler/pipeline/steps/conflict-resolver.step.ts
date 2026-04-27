import { Injectable } from '@nestjs/common';
import { TIME_BLOCKS } from '../../constants';
import { BlockType, Budget, TimeBlockDraft } from '../types/pipeline.types';

const ACTIVITIES_PER_BLOCK: Record<Budget, number> = {
  low: 2,
  medium: 3,
  high: 4,
};

@Injectable()
export class ConflictResolverStep {
  execute(blocks: TimeBlockDraft[], budget: Budget = 'medium'): TimeBlockDraft[] {
    const maxActivitiesPerBlock = ACTIVITIES_PER_BLOCK[budget];

    for (const block of blocks) {
      const blockMinutes = TIME_BLOCKS[block.type as BlockType].minutes;
      let used = 0;
      let activityCount = 0;
      const keptGroups: TimeBlockDraft['groups'] = [];

      for (const group of block.groups) {
        const groupMinutes = group.activities.reduce((sum, a) => {
          const [sh, sm] = a.startTime.split(':').map(Number);
          const [eh, em] = a.endTime.split(':').map(Number);
          return sum + (eh * 60 + em - (sh * 60 + sm));
        }, 0);

        const groupActivityCount = group.activities.length;

        if (
          used + groupMinutes <= blockMinutes &&
          activityCount + groupActivityCount <= maxActivitiesPerBlock
        ) {
          keptGroups.push(group);
          used += groupMinutes;
          activityCount += groupActivityCount;
        }
      }

      block.groups = keptGroups;
    }

    return blocks;
  }
}
