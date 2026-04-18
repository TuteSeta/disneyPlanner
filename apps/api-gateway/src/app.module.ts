import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TripsModule } from './modules/trips/trips.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { AiModule } from './modules/ai/ai.module';
import { PlannerModule } from './modules/planner/planner.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TripsModule,
    SchedulerModule,
    AiModule,
    PlannerModule,
  ],
})
export class AppModule {}
