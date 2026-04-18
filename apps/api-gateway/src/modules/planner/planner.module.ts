import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PlannerController } from './planner.controller';
import { PlannerService } from './planner.service';
import { AI_SERVICE, SCHEDULER_SERVICE, TRIP_SERVICE } from './planner.constants';

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
      {
        name: SCHEDULER_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('SCHEDULER_SERVICE_HOST'),
            port: config.get<number>('SCHEDULER_SERVICE_PORT'),
          },
        }),
      },
      {
        name: AI_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get<string>('AI_SERVICE_HOST'),
            port: config.get<number>('AI_SERVICE_PORT'),
          },
        }),
      },
    ]),
  ],
  controllers: [PlannerController],
  providers: [PlannerService],
})
export class PlannerModule {}
