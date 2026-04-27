import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { TripsModule } from './modules/trips/trips.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { AiModule } from './modules/ai/ai.module';
import { PlannerModule } from './modules/planner/planner.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [
        { name: 'default', ttl: 60000, limit: 60 },
        { name: 'plan', ttl: 60000, limit: 10 },
      ],
      // Rate-limit per API key instead of per IP
      generateKey: (_context, trackerKey, throttlerName) => {
        const req = _context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
        const apiKey = req.headers['x-api-key'] ?? trackerKey;
        return `${throttlerName}:${apiKey}`;
      },
    }),
    TripsModule,
    SchedulerModule,
    AiModule,
    PlannerModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
