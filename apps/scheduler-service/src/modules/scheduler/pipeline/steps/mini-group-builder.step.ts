import { Injectable } from '@nestjs/common';
import { INTENSITY_LIMITS, TIME_BLOCKS } from '../../constants';
import {
  ActivityGroupDraft,
  BlockType,
  Intensity,
  RankedAttraction,
  TimeBlockDraft,
} from '../types/pipeline.types';

const MIN_GROUP_SIZE = 2;
const MAX_GROUP_SIZE = 4;

@Injectable()
export class MiniGroupBuilderStep {
  execute(
    blocks: TimeBlockDraft[],
    attractions: RankedAttraction[],
    intensity: Intensity,
  ): TimeBlockDraft[] {
    const maxPerBlock = INTENSITY_LIMITS[intensity];
    const blockCapacities = this.buildCapacities(maxPerBlock);
    const remaining = [...attractions];

    for (const block of blocks) {
      const capacity = blockCapacities[block.type];
      const picked = this.pickAttractions(remaining, capacity);

      picked.forEach((a) => remaining.splice(remaining.indexOf(a), 1));

      block.groups = this.groupByArea(picked);
    }

    return blocks;
  }

  private buildCapacities(maxPerBlock: number): Record<BlockType, number> {
    return Object.keys(TIME_BLOCKS).reduce(
      (acc, key) => ({ ...acc, [key]: maxPerBlock }),
      {} as Record<BlockType, number>,
    );
  }

  private pickAttractions(attractions: RankedAttraction[], max: number): RankedAttraction[] {
    return attractions.slice(0, max);
  }

  private groupByArea(attractions: RankedAttraction[]): ActivityGroupDraft[] {
    const byArea = new Map<string, RankedAttraction[]>();

    for (const a of attractions) {
      const list = byArea.get(a.area) ?? [];
      list.push(a);
      byArea.set(a.area, list);
    }

    const groups: ActivityGroupDraft[] = [];
    let sortOrder = 0;

    for (const [area, items] of byArea) {
      for (let i = 0; i < items.length; i += MAX_GROUP_SIZE) {
        const chunk = items.slice(i, i + MAX_GROUP_SIZE);
        if (chunk.length < MIN_GROUP_SIZE && groups.length > 0) {
          groups[groups.length - 1].activities.push(
            ...chunk.map((a) => this.toActivityDraft(a)),
          );
        } else {
          groups.push({
            area,
            sortOrder: sortOrder++,
            activities: chunk.map((a) => this.toActivityDraft(a)),
          });
        }
      }
    }

    return groups;
  }

  private toActivityDraft(a: RankedAttraction) {
    return {
      name: a.name,
      activityType: a.entityType,
      startTime: '',
      endTime: '',
      priority: Math.round((100 - a.score) / 10) + 1,
      notes: a.waitTime > 0 ? `Typical wait: ~${a.waitTime} min` : '',
    };
  }
}
