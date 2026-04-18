import 'dotenv/config';
import { DataSource } from 'typeorm';

import { Trip } from './modules/trips/entities/trip.entity';
import { TripDay } from './modules/trips/entities/trip-day.entity';
import { Traveler } from './modules/trips/entities/traveler.entity';
import { TimeBlock } from './modules/trips/entities/time-block.entity';
import { ActivityGroup } from './modules/trips/entities/activity-group.entity';
import { Activity } from './modules/trips/entities/activity.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Trip, TripDay, Traveler, TimeBlock, ActivityGroup, Activity],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
