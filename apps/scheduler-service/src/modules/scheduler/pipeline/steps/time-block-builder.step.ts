import { Injectable } from '@nestjs/common';
import { TIME_BLOCKS } from '../../constants';
import { BlockType, TimeBlockDraft } from '../types/pipeline.types';

@Injectable()
export class TimeBlockBuilderStep {
  execute(): TimeBlockDraft[] {
    return (Object.entries(TIME_BLOCKS) as [BlockType, { start: string; end: string }][]).map(
      ([type, config]) => ({
        type,
        startTime: config.start,
        endTime: config.end,
        groups: [],
      }),
    );
  }
}
