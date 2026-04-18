import { Injectable } from '@nestjs/common';
import { TIME_BLOCKS } from '../../constants';
import { BlockType, TimeBlockDraft } from '../types/pipeline.types';

@Injectable()
export class ConflictResolverStep {
  execute(blocks: TimeBlockDraft[]): TimeBlockDraft[] {
    for (const block of blocks) {
      const blockMinutes = TIME_BLOCKS[block.type as BlockType].minutes;
      let used = 0;
      const keptGroups: TimeBlockDraft['groups'] = [];

      for (const group of block.groups) {
        const groupMinutes = group.activities.reduce((sum, a) => {
          const [sh, sm] = a.startTime.split(':').map(Number);
          const [eh, em] = a.endTime.split(':').map(Number);
          return sum + (eh * 60 + em - (sh * 60 + sm));
        }, 0);

        if (used + groupMinutes <= blockMinutes) {
          keptGroups.push(group);
          used += groupMinutes;
        }
      }

      block.groups = keptGroups;
    }

    return blocks;
  }
}
