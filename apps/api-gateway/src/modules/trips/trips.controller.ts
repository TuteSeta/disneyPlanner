import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { TripsService } from './trips.service';

@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  // ─── Trips ────────────────────────────────────────────────────────────────

  @Post()
  createTrip(@Body() body: unknown) {
    return this.tripsService.createTrip(body);
  }

  @Get()
  getTrips() {
    return this.tripsService.getTrips();
  }

  @Get(':id')
  getTrip(@Param('id', ParseIntPipe) id: number) {
    return this.tripsService.getTrip(id);
  }

  @Get(':id/calendar')
  getCalendar(@Param('id', ParseIntPipe) id: number) {
    return this.tripsService.getCalendar(id);
  }

  @Get(':id/calendar/:dayNumber')
  getCalendarDay(
    @Param('id', ParseIntPipe) id: number,
    @Param('dayNumber', ParseIntPipe) dayNumber: number,
  ) {
    return this.tripsService.getCalendarDay(id, dayNumber);
  }

  @Patch(':id')
  updateTrip(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    return this.tripsService.updateTrip(id, body);
  }

  @Delete(':id')
  deleteTrip(@Param('id', ParseIntPipe) id: number) {
    return this.tripsService.deleteTrip(id);
  }

  // ─── Trip Days ────────────────────────────────────────────────────────────

  @Patch('days/:id')
  updateTripDay(@Param('id', ParseIntPipe) id: number, @Body() body: unknown) {
    return this.tripsService.updateTripDay(id, body);
  }

  // ─── Travelers ────────────────────────────────────────────────────────────

  @Post(':tripId/travelers')
  addTraveler(
    @Param('tripId', ParseIntPipe) tripId: number,
    @Body() body: unknown,
  ) {
    return this.tripsService.addTraveler(tripId, body);
  }

  @Patch('travelers/:id')
  updateTraveler(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.tripsService.updateTraveler(id, body);
  }

  @Delete('travelers/:id')
  removeTraveler(@Param('id', ParseIntPipe) id: number) {
    return this.tripsService.removeTraveler(id);
  }

  // ─── Activities ───────────────────────────────────────────────────────────

  @Post('activities')
  addActivity(@Body() body: unknown) {
    return this.tripsService.addActivity(body);
  }

  @Patch('activities/:id')
  updateActivity(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    return this.tripsService.updateActivity(id, body);
  }

  @Delete('activities/:id')
  deleteActivity(@Param('id', ParseIntPipe) id: number) {
    return this.tripsService.deleteActivity(id);
  }
}
