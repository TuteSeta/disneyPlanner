import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { TripsService } from './trips.service';

import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { UpdateTripDayDto } from './dto/update-trip-day.dto';
import { CreateTravelerDto } from './dto/create-traveler.dto';
import { UpdateTravelerDto } from './dto/update-traveler.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { SaveScheduleDto } from './dto/save-schedule.dto';

@Controller()
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  // ─── Trips ────────────────────────────────────────────────────────────────

  @MessagePattern('create_trip')
  createTrip(@Payload() dto: CreateTripDto) {
    return this.tripsService.createTrip(dto);
  }

  @MessagePattern('get_trips')
  getTrips() {
    return this.tripsService.getTrips();
  }

  @MessagePattern('get_trip')
  getTrip(@Payload() payload: { id: number }) {
    return this.tripsService.getTrip(payload.id);
  }

  @MessagePattern('update_trip')
  updateTrip(@Payload() payload: { id: number; dto: UpdateTripDto }) {
    return this.tripsService.updateTrip(payload.id, payload.dto);
  }

  @MessagePattern('delete_trip')
  deleteTrip(@Payload() payload: { id: number }) {
    return this.tripsService.deleteTrip(payload.id);
  }

  // ─── Trip Days ────────────────────────────────────────────────────────────

  @MessagePattern('update_trip_day')
  updateTripDay(@Payload() payload: { id: number; dto: UpdateTripDayDto }) {
    return this.tripsService.updateTripDay(payload.id, payload.dto);
  }

  // ─── Travelers ────────────────────────────────────────────────────────────

  @MessagePattern('add_traveler')
  addTraveler(@Payload() payload: { tripId: number; dto: CreateTravelerDto }) {
    return this.tripsService.addTraveler(payload.tripId, payload.dto);
  }

  @MessagePattern('update_traveler')
  updateTraveler(@Payload() payload: { id: number; dto: UpdateTravelerDto }) {
    return this.tripsService.updateTraveler(payload.id, payload.dto);
  }

  @MessagePattern('remove_traveler')
  removeTraveler(@Payload() payload: { id: number }) {
    return this.tripsService.removeTraveler(payload.id);
  }

  // ─── Calendar ─────────────────────────────────────────────────────────────

  @MessagePattern('get_calendar')
  getCalendar(@Payload() payload: { tripId: number }) {
    return this.tripsService.getCalendar(payload.tripId);
  }

  @MessagePattern('get_calendar_day')
  getCalendarDay(@Payload() payload: { tripId: number; dayNumber: number }) {
    return this.tripsService.getCalendarDay(payload.tripId, payload.dayNumber);
  }

  // ─── Schedule ─────────────────────────────────────────────────────────────

  @MessagePattern('save_schedule')
  saveSchedule(@Payload() dto: SaveScheduleDto) {
    return this.tripsService.saveSchedule(dto);
  }

  // ─── Activities ───────────────────────────────────────────────────────────

  @MessagePattern('add_activity')
  addActivity(@Payload() dto: CreateActivityDto) {
    return this.tripsService.addActivity(dto);
  }

  @MessagePattern('update_activity')
  updateActivity(@Payload() payload: { id: number; dto: UpdateActivityDto }) {
    return this.tripsService.updateActivity(payload.id, payload.dto);
  }

  @MessagePattern('delete_activity')
  deleteActivity(@Payload() payload: { id: number }) {
    return this.tripsService.deleteActivity(payload.id);
  }
}
