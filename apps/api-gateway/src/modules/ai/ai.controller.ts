import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('enrich')
  enrichSchedule(@Body() body: unknown) {
    return this.aiService.enrichSchedule(body);
  }
}
