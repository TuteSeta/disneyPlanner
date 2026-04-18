import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { TRIP_SERVICE } from './trips.constants';

@Injectable()
export class TripsService {
  constructor(
    @Inject(TRIP_SERVICE) private readonly client: ClientProxy,
  ) {}

  // ─── Trips ────────────────────────────────────────────────────────────────

  createTrip(dto: unknown) {
    return firstValueFrom(this.client.send('create_trip', dto));
  }

  getTrips() {
    return firstValueFrom(this.client.send('get_trips', {}));
  }

  getTrip(id: number) {
    return firstValueFrom(this.client.send('get_trip', { id }));
  }

  updateTrip(id: number, dto: unknown) {
    return firstValueFrom(this.client.send('update_trip', { id, dto }));
  }

  deleteTrip(id: number) {
    return firstValueFrom(this.client.send('delete_trip', { id }));
  }

  // ─── Trip Days ────────────────────────────────────────────────────────────

  updateTripDay(id: number, dto: unknown) {
    return firstValueFrom(this.client.send('update_trip_day', { id, dto }));
  }

  // ─── Travelers ────────────────────────────────────────────────────────────

  addTraveler(tripId: number, dto: unknown) {
    return firstValueFrom(this.client.send('add_traveler', { tripId, dto }));
  }

  updateTraveler(id: number, dto: unknown) {
    return firstValueFrom(this.client.send('update_traveler', { id, dto }));
  }

  removeTraveler(id: number) {
    return firstValueFrom(this.client.send('remove_traveler', { id }));
  }

  // ─── Calendar ─────────────────────────────────────────────────────────────

  getCalendar(tripId: number) {
    return firstValueFrom(this.client.send('get_calendar', { tripId }));
  }

  getCalendarDay(tripId: number, dayNumber: number) {
    return firstValueFrom(this.client.send('get_calendar_day', { tripId, dayNumber }));
  }

  // ─── Activities ───────────────────────────────────────────────────────────

  addActivity(dto: unknown) {
    return firstValueFrom(this.client.send('add_activity', dto));
  }

  updateActivity(id: number, dto: unknown) {
    return firstValueFrom(this.client.send('update_activity', { id, dto }));
  }

  deleteActivity(id: number) {
    return firstValueFrom(this.client.send('delete_activity', { id }));
  }
}
