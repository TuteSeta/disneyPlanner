import { z } from 'zod';

/**
 * Schema for the planTrip() Claude output.
 * Validates the full trip plan JSON structure returned by the LLM.
 */
export const PlanTripOutputSchema = z.object({
  trip: z.object({
    name: z.string(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD'),
    description: z.string(),
    travelers: z.array(
      z.object({
        name: z.string(),
        age: z.number().int().min(0).max(120),
      }),
    ),
  }),
  preferences: z.object({
    intensity: z.enum(['relaxed', 'normal', 'aggressive']),
    hasKids: z.boolean(),
  }),
  days: z.array(
    z.object({
      dayNumber: z.number().int().min(1),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      dayType: z.enum(['THEME_PARK', 'SHOPPING', 'REST', 'MIXED', 'SIGHTSEEING']),
      locationLabel: z.string(),
      parkId: z.string().optional().nullable(),
      passRecommendation: z.string().optional().nullable(),
      budget: z.enum(['low', 'medium', 'high']).optional().nullable(),
    }),
  ),
});

export type PlanTripOutput = z.infer<typeof PlanTripOutputSchema>;

/**
 * Schema for the generateActivities() Claude output.
 * Validates each activity in the enrichment array.
 */
export const ActivityArraySchema = z.array(
  z.object({
    name: z.string(),
    activityType: z.string(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'startTime must be HH:MM'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'endTime must be HH:MM'),
    priority: z.number().int().min(1).max(10),
    notes: z.string(),
  }),
);

export type ActivityArray = z.infer<typeof ActivityArraySchema>;
