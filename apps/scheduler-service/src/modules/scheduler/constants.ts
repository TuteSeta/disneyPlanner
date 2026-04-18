export const TRIP_SERVICE = 'TRIP_SERVICE';

export const THEMEPARKS_WDW_DESTINATION = 'waltdisneyworldresort';

export const TIME_BLOCKS = {
  morning:   { start: '09:00', end: '12:00', minutes: 180 },
  midday:    { start: '12:00', end: '15:00', minutes: 180 },
  afternoon: { start: '15:00', end: '18:00', minutes: 180 },
  evening:   { start: '18:00', end: '22:00', minutes: 240 },
} as const;

export const INTENSITY_LIMITS: Record<string, number> = {
  relaxed:    3,
  normal:     4,
  aggressive: 5,
};

export const DURATION_ESTIMATES: Record<string, number> = {
  ATTRACTION: 20,
  SHOW:       35,
  EXPERIENCE: 25,
  RESTAURANT: 60,
};
