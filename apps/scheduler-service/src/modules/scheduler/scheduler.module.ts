import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';
import { PipelineService } from './pipeline/pipeline.service';
import { ParksService } from './parks/parks.service';
import { ActivityLoaderStep } from './pipeline/steps/activity-loader.step';
import { ActivityRankerStep } from './pipeline/steps/activity-ranker.step';
import { TimeBlockBuilderStep } from './pipeline/steps/time-block-builder.step';
import { MiniGroupBuilderStep } from './pipeline/steps/mini-group-builder.step';
import { TimeSlotAssignerStep } from './pipeline/steps/time-slot-assigner.step';
import { ConflictResolverStep } from './pipeline/steps/conflict-resolver.step';
import { TRIP_SERVICE } from './constants';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: TRIP_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('TRIP_SERVICE_HOST'),
            port: config.get<number>('TRIP_SERVICE_PORT'),
          },
        }),
      },
    ]),
  ],
  controllers: [SchedulerController],
  providers: [
    SchedulerService,
    PipelineService,
    ParksService,
    ActivityLoaderStep,
    ActivityRankerStep,
    TimeBlockBuilderStep,
    MiniGroupBuilderStep,
    TimeSlotAssignerStep,
    ConflictResolverStep,
  ],
})
export class SchedulerModule {}
