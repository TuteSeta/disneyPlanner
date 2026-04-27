import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { SCHEDULER_SERVICE } from './scheduler.constants';

@Injectable()
export class SchedulerService {
  constructor(
    @Inject(SCHEDULER_SERVICE) private readonly client: ClientProxy,
  ) {}

  generateSchedule(body: unknown) {
    return firstValueFrom(this.client.send('generate_schedule', body));
  }

  getAvailableParks() {
    return firstValueFrom(this.client.send('get_available_parks', {}));
  }
}
