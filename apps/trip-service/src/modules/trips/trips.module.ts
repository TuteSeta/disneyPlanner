import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';

import { Trip } from './entities/trip.entity';
import { TripDay } from './entities/trip-day.entity';
import { Traveler } from './entities/traveler.entity';
import { TimeBlock } from './entities/time-block.entity';
import { ActivityGroup } from './entities/activity-group.entity';
import { Activity } from './entities/activity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, TripDay, Traveler, TimeBlock, ActivityGroup, Activity])],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}