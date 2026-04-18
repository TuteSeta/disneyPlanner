import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AI_SERVICE } from './ai.constants';

@Module({
  imports: [
    ClientsModule.registerAsync([
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
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
