import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { SchedulerController } from './scheduler.controller';
import { SchedulerService } from './scheduler.service';
import { SCHEDULER_SERVICE } from './scheduler.constants';

@Module({
  imports: [
    ClientsModule.registerAsync([
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
    ]),
  ],
  controllers: [SchedulerController],
  providers: [SchedulerService],
})
export class SchedulerModule {}
