import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { TRIP_SERVICE } from './trips.constants';

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
  controllers: [TripsController],
  providers: [TripsService],
})
export class TripsModule {}
