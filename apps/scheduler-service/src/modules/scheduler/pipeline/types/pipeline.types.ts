export type Intensity = 'relaxed' | 'normal' | 'aggressive';
export type BlockType = 'morning' | 'midday' | 'afternoon' | 'evening';
export type AttractionStatus = 'OPERATING' | 'DOWN' | 'CLOSED' | 'REFURBISHMENT';
export type AttractionEntityType = 'ATTRACTION' | 'SHOW' | 'EXPERIENCE' | 'RESTAURANT';

export type Budget = 'low' | 'medium' | 'high';

export interface SchedulePreferences {
  intensity: Intensity;
  priorityAttractions: string[];
  hasKids: boolean;
  budget: Budget;
}

export interface PlanningContext {
  tripId: number;
  destinationSlug: string;
  days: DayInput[];
  preferences: SchedulePreferences;
}

export type DayType = 'THEME_PARK' | 'SHOPPING' | 'REST' | 'MIXED' | 'SIGHTSEEING';

export interface DayInput {
  dayId: number;
  dayType: DayType;
  parkId?: string;
}

export interface ParkAttraction {
  id: string;
  name: string;
  area: string;
  entityType: AttractionEntityType;
  status: AttractionStatus;
  waitTime: number;
}

export interface RankedAttraction extends ParkAttraction {
  score: number;
  estimatedDuration: number;
}

export interface ActivityDraft {
  name: string;
  activityType: string;
  startTime: string;
  endTime: string;
  priority: number;
  notes: string;
}

export interface ActivityGroupDraft {
  area: string;
  sortOrder: number;
  activities: ActivityDraft[];
}

export interface TimeBlockDraft {
  type: BlockType;
  startTime: string;
  endTime: string;
  groups: ActivityGroupDraft[];
}

export interface DaySchedule {
  dayId: number;
  dayType: DayType;
  timeBlocks: TimeBlockDraft[];
}

export interface GeneratedSchedule {
  tripId: number;
  days: DaySchedule[];
}
