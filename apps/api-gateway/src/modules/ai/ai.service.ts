import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AI_SERVICE } from './ai.constants';

@Injectable()
export class AiService {
  constructor(
    @Inject(AI_SERVICE) private readonly client: ClientProxy,
  ) {}

  enrichSchedule(body: unknown) {
    return firstValueFrom(this.client.send('enrich_schedule', body));
  }
}
