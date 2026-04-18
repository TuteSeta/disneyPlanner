import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Trip } from './entities/trip.entity';
import { TripDay } from './entities/trip-day.entity';
import { Traveler } from './entities/traveler.entity';
import { TimeBlock } from './entities/time-block.entity';
import { ActivityGroup } from './entities/activity-group.entity';
import { Activity } from './entities/activity.entity';

import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { UpdateTripDayDto } from './dto/update-trip-day.dto';
import { CreateTravelerDto } from './dto/create-traveler.dto';
import { UpdateTravelerDto } from './dto/update-traveler.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { SaveScheduleDto } from './dto/save-schedule.dto';

import { DayType } from './enums/day-type.enum';
import { TimeBlockType } from './enums/time-block-type.enum';
import { ActivityType } from './enums/activity-type.enum';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,

    @InjectRepository(TripDay)
    private readonly dayRepo: Repository<TripDay>,

    @InjectRepository(Traveler)
    private readonly travelerRepo: Repository<Traveler>,

    @InjectRepository(TimeBlock)
    private readonly timeBlockRepo: Repository<TimeBlock>,

    @InjectRepository(ActivityGroup)
    private readonly groupRepo: Repository<ActivityGroup>,

    @InjectRepository(Activity)
    private readonly activityRepo: Repository<Activity>,
  ) {}

  // ─── Trips ────────────────────────────────────────────────────────────────

  async createTrip(dto: CreateTripDto): Promise<Trip> {
    this.validateDateRange(dto.startDate, dto.endDate);

    const trip = this.tripRepo.create({
      name: dto.name,
      startDate: dto.startDate,
      endDate: dto.endDate,
      description: dto.description ?? null,
    });
    const savedTrip = await this.tripRepo.save(trip);

    const days = this.generateDays(savedTrip);
    await this.dayRepo.save(days);

    if (dto.travelers?.length) {
      const travelers = dto.travelers.map((t) =>
        this.travelerRepo.create({ ...t, trip: savedTrip }),
      );
      await this.travelerRepo.save(travelers);
    }

    return this.findTripById(savedTrip.id);
  }

  async getTrips(): Promise<Trip[]> {
    return this.tripRepo.find({
      relations: ['days', 'travelers'],
      order: { startDate: 'ASC' },
    });
  }

  async getTrip(id: number): Promise<Trip> {
    return this.findTripById(id);
  }

  async updateTrip(id: number, dto: UpdateTripDto): Promise<Trip> {
    const trip = await this.findTripById(id);
    Object.assign(trip, dto);
    await this.tripRepo.save(trip);
    return this.findTripById(id);
  }

  async deleteTrip(id: number): Promise<void> {
    const trip = await this.findTripById(id);
    await this.tripRepo.remove(trip);
  }

  // ─── Trip Days ────────────────────────────────────────────────────────────

  async updateTripDay(id: number, dto: UpdateTripDayDto): Promise<TripDay> {
    const day = await this.dayRepo.findOne({ where: { id } });
    if (!day) throw new NotFoundException(`TripDay with id ${id} not found.`);
    Object.assign(day, dto);
    return this.dayRepo.save(day);
  }

  // ─── Travelers ────────────────────────────────────────────────────────────

  async addTraveler(tripId: number, dto: CreateTravelerDto): Promise<Traveler> {
    const trip = await this.findTripById(tripId);
    const traveler = this.travelerRepo.create({ ...dto, trip });
    return this.travelerRepo.save(traveler);
  }

  async updateTraveler(id: number, dto: UpdateTravelerDto): Promise<Traveler> {
    const traveler = await this.travelerRepo.findOne({ where: { id } });
    if (!traveler) throw new NotFoundException(`Traveler with id ${id} not found.`);
    Object.assign(traveler, dto);
    return this.travelerRepo.save(traveler);
  }

  async removeTraveler(id: number): Promise<void> {
    const traveler = await this.travelerRepo.findOne({ where: { id } });
    if (!traveler) throw new NotFoundException(`Traveler with id ${id} not found.`);
    await this.travelerRepo.remove(traveler);
  }

  // ─── Activities ───────────────────────────────────────────────────────────

  async addActivity(dto: CreateActivityDto): Promise<Activity> {
    const group = await this.groupRepo.findOne({ where: { id: dto.groupId } });
    if (!group) throw new NotFoundException(`ActivityGroup with id ${dto.groupId} not found.`);
    const { groupId, ...fields } = dto;
    const activity = this.activityRepo.create({ ...fields, group });
    return this.activityRepo.save(activity);
  }

  async updateActivity(id: number, dto: UpdateActivityDto): Promise<Activity> {
    const activity = await this.activityRepo.findOne({ where: { id } });
    if (!activity) throw new NotFoundException(`Activity with id ${id} not found.`);
    Object.assign(activity, dto);
    return this.activityRepo.save(activity);
  }

  async deleteActivity(id: number): Promise<void> {
    const activity = await this.activityRepo.findOne({ where: { id } });
    if (!activity) throw new NotFoundException(`Activity with id ${id} not found.`);
    await this.activityRepo.remove(activity);
  }

  // ─── Schedule ─────────────────────────────────────────────────────────────

  async saveSchedule(dto: SaveScheduleDto): Promise<{ ok: boolean }> {
    for (const dayDto of dto.days) {
      const day = await this.dayRepo.findOne({ where: { id: dayDto.dayId } });
      if (!day) continue;

      if (dayDto.dayType) {
        day.dayType = dayDto.dayType as DayType;
        await this.dayRepo.save(day);
      }

      await this.timeBlockRepo.delete({ tripDay: { id: day.id } });

      for (const blockDto of dayDto.timeBlocks) {
        const block = this.timeBlockRepo.create({
          type: blockDto.type as TimeBlockType,
          startTime: blockDto.startTime,
          endTime: blockDto.endTime,
          tripDay: day,
        });
        const savedBlock = await this.timeBlockRepo.save(block);

        for (const groupDto of blockDto.groups) {
          const group = this.groupRepo.create({
            area: groupDto.area,
            sortOrder: groupDto.sortOrder,
            timeBlock: savedBlock,
          });
          const savedGroup = await this.groupRepo.save(group);

          for (const activityDto of groupDto.activities) {
            const activity = this.activityRepo.create({
              name: activityDto.name,
              activityType: this.mapActivityType(activityDto.activityType),
              startTime: activityDto.startTime,
              endTime: activityDto.endTime,
              priority: activityDto.priority,
              notes: activityDto.notes || null,
              group: savedGroup,
            });
            await this.activityRepo.save(activity);
          }
        }
      }
    }
    return { ok: true };
  }

  private mapActivityType(raw: string): ActivityType {
    const map: Record<string, ActivityType> = {
      ATTRACTION: ActivityType.RIDE,
      SHOW:       ActivityType.SHOW,
      EXPERIENCE: ActivityType.EXPERIENCE,
    };
    return map[raw] ?? ActivityType.EXPERIENCE;
  }

  // ─── Calendar ─────────────────────────────────────────────────────────────

  async getCalendar(tripId: number) {
    const trip = await this.findTripById(tripId);

    return {
      tripId: trip.id,
      name: trip.name,
      startDate: trip.startDate,
      endDate: trip.endDate,
      travelers: trip.travelers.map((t) => t.name),
      days: trip.days
        .sort((a, b) => a.dayNumber - b.dayNumber)
        .map((day) => ({
          dayNumber: day.dayNumber,
          date: day.date,
          dayType: day.dayType,
          locationLabel: day.locationLabel,
          passRecommendation: day.passRecommendation,
          totalActivities: day.timeBlocks.reduce(
            (sum, block) =>
              sum + block.groups.reduce((s, g) => s + g.activities.length, 0),
            0,
          ),
        })),
    };
  }

  async getCalendarDay(tripId: number, dayNumber: number) {
    const trip = await this.findTripById(tripId);
    const day = trip.days.find((d) => d.dayNumber === dayNumber);
    if (!day) throw new NotFoundException(`Day ${dayNumber} not found in trip ${tripId}.`);

    const activities = day.timeBlocks
      .flatMap((block) => block.groups.flatMap((group) => group.activities))
      .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''))
      .map((a) => ({
        time: `${a.startTime} - ${a.endTime}`,
        name: a.name,
        type: a.activityType,
        notes: a.notes,
      }));

    return {
      dayNumber: day.dayNumber,
      date: day.date,
      dayType: day.dayType,
      locationLabel: day.locationLabel,
      passRecommendation: day.passRecommendation,
      activities,
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private async findTripById(id: number): Promise<Trip> {
    const trip = await this.tripRepo.findOne({
      where: { id },
      relations: [
        'days',
        'days.timeBlocks',
        'days.timeBlocks.groups',
        'days.timeBlocks.groups.activities',
        'travelers',
      ],
    });

    if (!trip) {
      throw new NotFoundException(`Trip with id ${id} not found.`);
    }

    return trip;
  }

  private generateDays(trip: Trip): TripDay[] {
    const days: TripDay[] = [];
    const start = this.parseUtcDate(trip.startDate);
    const end = this.parseUtcDate(trip.endDate);

    let current = new Date(start);
    let dayNumber = 1;

    while (current <= end) {
      const day = this.dayRepo.create({
        dayNumber,
        date: current.toISOString().split('T')[0],
        dayType: DayType.MIXED,
        locationLabel: null,
        trip,
      });

      days.push(day);
      current.setUTCDate(current.getUTCDate() + 1);
      dayNumber++;
    }

    return days;
  }

  private parseUtcDate(dateStr: string): Date {
    return new Date(`${dateStr}T00:00:00Z`);
  }

  private validateDateRange(startDate: string, endDate: string): void {
    const start = this.parseUtcDate(startDate);
    const end = this.parseUtcDate(endDate);

    if (start > end) {
      throw new BadRequestException(
        `startDate (${startDate}) must be before or equal to endDate (${endDate}).`,
      );
    }

    const maxDays = 365;
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (diff > maxDays) {
      throw new BadRequestException(
        `Trip duration exceeds maximum of ${maxDays} days.`,
      );
    }
  }
}
