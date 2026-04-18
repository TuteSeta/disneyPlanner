import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AI_SERVICE, SCHEDULER_SERVICE, TRIP_SERVICE } from './planner.constants';

interface PlannedDay {
  dayNumber: number;
  date: string;
  dayType: 'DISNEY' | 'UNIVERSAL' | 'REST' | 'SHOPPING';
  locationLabel?: string;
  parkId?: string;
  passRecommendation?: string | null;
  budget?: 'low' | 'medium' | 'high' | null;
}

interface AiPlan {
  trip: {
    name: string;
    startDate: string;
    endDate: string;
    description?: string;
    travelers: { name: string; age?: number }[];
  };
  preferences: {
    intensity: 'relaxed' | 'normal' | 'aggressive';
    hasKids: boolean;
  };
  days: PlannedDay[];
}

interface CreatedTripDay {
  id: number;
  dayNumber: number;
}

interface CreatedTrip {
  id: number;
  days: CreatedTripDay[];
}

@Injectable()
export class PlannerService {
  private readonly logger = new Logger(PlannerService.name);

  constructor(
    @Inject(TRIP_SERVICE) private readonly tripClient: ClientProxy,
    @Inject(SCHEDULER_SERVICE) private readonly schedulerClient: ClientProxy,
    @Inject(AI_SERVICE) private readonly aiClient: ClientProxy,
  ) {}

  async plan(description: string) {
    this.logger.log('Fetching available parks');
    const availableParks = await firstValueFrom(
      this.schedulerClient.send('get_orlando_parks', {}),
    );

    this.logger.log('Asking AI to plan the trip');
    const aiPlan: AiPlan = await firstValueFrom(
      this.aiClient.send('plan_trip', { description, availableParks }),
    );

    this.logger.log(
      `Creating trip "${aiPlan.trip.name}" (${aiPlan.trip.startDate} → ${aiPlan.trip.endDate})`,
    );
    const createdTrip: CreatedTrip = await firstValueFrom(
      this.tripClient.send('create_trip', {
        name: aiPlan.trip.name,
        startDate: aiPlan.trip.startDate,
        endDate: aiPlan.trip.endDate,
        description: aiPlan.trip.description,
        travelers: aiPlan.trip.travelers,
      }),
    );

    const dayIdByNumber = new Map(
      createdTrip.days.map((d) => [d.dayNumber, d.id]),
    );

    this.logger.log(`Patching ${aiPlan.days.length} days with type/location/pass`);
    await Promise.all(
      aiPlan.days.map((planDay) => {
        const dayId = dayIdByNumber.get(planDay.dayNumber);
        if (!dayId) return null;
        return firstValueFrom(
          this.tripClient.send('update_trip_day', {
            id: dayId,
            dto: {
              dayType: planDay.dayType,
              locationLabel: planDay.locationLabel,
              passRecommendation: planDay.passRecommendation ?? undefined,
            },
          }),
        );
      }),
    );

    const parkDays = aiPlan.days
      .filter((d) => d.dayType === 'DISNEY' || d.dayType === 'UNIVERSAL')
      .map((d) => ({
        dayId: dayIdByNumber.get(d.dayNumber)!,
        dayType: d.dayType,
        parkId: d.parkId,
      }))
      .filter((d) => d.dayId && d.parkId);

    if (parkDays.length > 0) {
      this.logger.log(`Generating schedule for ${parkDays.length} park days`);
      await firstValueFrom(
        this.schedulerClient.send('generate_schedule', {
          tripId: createdTrip.id,
          days: parkDays,
          preferences: aiPlan.preferences,
        }),
      );
    }

    const leisureDays = aiPlan.days.filter(
      (d) => d.dayType === 'REST' || d.dayType === 'SHOPPING',
    );

    if (leisureDays.length > 0) {
      this.logger.log(`Enriching ${leisureDays.length} leisure days in parallel`);
      await Promise.all(
        leisureDays.map((day) => {
          const dayId = dayIdByNumber.get(day.dayNumber);
          if (!dayId) return null;
          return firstValueFrom(
            this.aiClient.send('enrich_schedule', {
              tripId: createdTrip.id,
              dayId,
              dayType: day.dayType,
              budget: day.budget ?? 'medium',
            }),
          );
        }),
      );
    }

    this.logger.log(`Plan complete — returning calendar for trip ${createdTrip.id}`);
    return firstValueFrom(
      this.tripClient.send('get_calendar', { tripId: createdTrip.id }),
    );
  }
}
