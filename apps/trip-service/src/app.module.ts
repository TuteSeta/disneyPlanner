import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TripsModule } from './modules/trips/trips.module';
import { Trip } from './modules/trips/entities/trip.entity';
import { TripDay } from './modules/trips/entities/trip-day.entity';
import { Traveler } from './modules/trips/entities/traveler.entity';
import { TimeBlock } from './modules/trips/entities/time-block.entity';
import { ActivityGroup } from './modules/trips/entities/activity-group.entity';
import { Activity } from './modules/trips/entities/activity.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [Trip, TripDay, Traveler, TimeBlock, ActivityGroup, Activity],
        synchronize: false,
      }),
    }),

    TripsModule,
  ],
})
export class AppModule {}
