import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { RpcException } from '@nestjs/microservices';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';
import { firstValueFrom } from 'rxjs';
import { EnrichScheduleDto } from './dto/enrich-schedule.dto';
import { PlanTripDto } from './dto/plan-trip.dto';
import { ActivityArraySchema, PlanTripOutputSchema } from './schemas/claude-output.schemas';
import { withRetry } from './utils/retry.util';
import { PlanCacheService } from './cache/plan-cache.service';

const TTL_PLAN_TRIP_MS = 4 * 60 * 60 * 1000;   // 4 hours
const TTL_ENRICH_MS    = 2 * 60 * 60 * 1000;   // 2 hours

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly anthropic: Anthropic;
  private readonly tripClient: ClientProxy;
  private readonly planTripSystem: string;
  private readonly enrichSystem: string;

  constructor(
    private readonly config: ConfigService,
    private readonly cache: PlanCacheService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
    });

    this.tripClient = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: {
        host: this.config.get<string>('TRIP_SERVICE_HOST') ?? 'localhost',
        port: this.config.get<number>('TRIP_SERVICE_PORT') ?? 4001,
      },
    });

    // Load prompts at startup — fail fast if files are missing
    this.planTripSystem = readFileSync(
      join(__dirname, 'prompts', 'plan-trip.system.txt'),
      'utf-8',
    );
    this.enrichSystem = readFileSync(
      join(__dirname, 'prompts', 'enrich-schedule.system.txt'),
      'utf-8',
    );
  }

  async enrichSchedule(dto: EnrichScheduleDto) {
    const activities = await this.generateActivities(dto);

    const savePayload = {
      tripId: dto.tripId,
      days: [
        {
          dayId: dto.dayId,
          dayType: dto.dayType,
          timeBlocks: [
            {
              type: 'morning',
              startTime: '09:00',
              endTime: '21:00',
              groups: [
                {
                  area: dto.locationLabel ?? (dto.dayType === 'REST' ? 'Relaxation' : 'Shopping District'),
                  sortOrder: 1,
                  activities,
                },
              ],
            },
          ],
        },
      ],
    };

    await firstValueFrom(this.tripClient.send('save_schedule', savePayload));
    this.logger.log(`Day ${dto.dayId} enriched with ${activities.length} AI activities`);

    return { success: true, activitiesGenerated: activities.length };
  }

  async planTrip(dto: PlanTripDto) {
    this.logger.log(`Planning trip from description (${dto.description.length} chars)`);

    const parksJson = dto.availableParks
      ? JSON.stringify(dto.availableParks)
      : 'null';

    const cacheKey = this.cache.buildKey(dto.description, parksJson);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.logger.log('cache_hit: planTrip');
      return cached;
    }

    const today = new Date().toISOString().split('T')[0];
    const userContent = `Hoy es ${today}.\n\nParques disponibles (usá exactamente estos IDs):\n${parksJson}\n\nDescripción del viaje:\n"""\n${dto.description}\n"""`;

    let message: Anthropic.Message;

    try {
      message = await withRetry(() =>
        this.anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: dto.maxTokens ?? 4096,
          system: [{ type: 'text', text: this.planTripSystem, cache_control: { type: 'ephemeral' } }],
          messages: [{ role: 'user', content: userContent }],
        }),
      );
    } catch (err) {
      this.logger.error('planTrip: Claude unavailable after retries', err);
      throw new RpcException({ error: 'ai_unavailable', message: 'AI service is temporarily unavailable' });
    }

    this.logCost('plan_trip', message);

    const text = (message.content[0] as { type: string; text: string }).text;
    const plan = this.parsePlanTripOutput(text);

    this.cache.set(cacheKey, plan, TTL_PLAN_TRIP_MS);
    this.logger.log(`Plan generated: ${plan.days?.length ?? 0} days`);
    return plan;
  }

  private async generateActivities(dto: EnrichScheduleDto) {
    const cacheKey = this.cache.buildKey(dto.dayType, dto.budget, dto.locationLabel ?? '');
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.logger.log('cache_hit: generateActivities');
      return cached as ReturnType<typeof this.fallbackActivities>;
    }

    const budgetDescriptions: Record<string, string> = {
      low: 'bajo presupuesto (gratuito o económico)',
      medium: 'presupuesto moderado',
      high: 'presupuesto alto, experiencias premium',
    };

    const typeDescriptions: Record<string, string> = {
      REST: 'día de descanso y relax cerca de Orlando',
      SHOPPING: 'día de compras en Orlando',
    };

    let message: Anthropic.Message;

    try {
      message = await withRetry(() =>
        this.anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: dto.maxTokens ?? 1024,
          system: [{ type: 'text', text: this.enrichSystem, cache_control: { type: 'ephemeral' } }],
          messages: [
            {
              role: 'user',
              content: `El viajero tiene un ${typeDescriptions[dto.dayType]} con ${budgetDescriptions[dto.budget]}. Ubicación del día: ${dto.locationLabel ?? 'Orlando, Florida'}. Generá actividades específicas y coherentes con esa ubicación.`,
            },
          ],
        }),
      );
    } catch (err) {
      this.logger.warn('generateActivities: Claude unavailable, using fallback', err);
      return this.fallbackActivities();
    }

    this.logCost('enrich_schedule', message);

    const text = (message.content[0] as { type: string; text: string }).text;
    const activities = this.parseActivities(text);

    this.cache.set(cacheKey, activities, TTL_ENRICH_MS);
    return activities;
  }

  private parsePlanTripOutput(text: string) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      this.logger.error('parsePlanTripOutput: no JSON object in response');
      throw new RpcException({ error: 'ai_parse_error', message: 'Claude response did not contain a valid JSON object' });
    }

    const parsed = PlanTripOutputSchema.safeParse(JSON.parse(match[0]));
    if (!parsed.success) {
      this.logger.error('parsePlanTripOutput: Zod validation failed', parsed.error.flatten());
      throw new RpcException({ error: 'ai_output_invalid', message: 'Claude response failed schema validation' });
    }

    return parsed.data;
  }

  private parseActivities(text: string) {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON array found');

      const parsed = ActivityArraySchema.safeParse(JSON.parse(jsonMatch[0]));
      if (!parsed.success) {
        this.logger.warn('parseActivities: Zod validation failed', parsed.error.flatten());
        return this.fallbackActivities();
      }

      return parsed.data;
    } catch (e) {
      this.logger.warn('parseActivities: parse error, using fallback', e);
      return this.fallbackActivities();
    }
  }

  private logCost(
    type: 'plan_trip' | 'enrich_schedule',
    message: Anthropic.Message,
  ) {
    const input = message.usage.input_tokens;
    const output = message.usage.output_tokens;
    const estimatedCostUSD = (input * 0.00000025 + output * 0.00000125).toFixed(6);

    this.logger.log(
      JSON.stringify({
        event: 'ai_call',
        type,
        model: message.model,
        inputTokens: input,
        outputTokens: output,
        cacheHit: false,
        estimatedCostUSD,
      }),
    );
  }

  private fallbackActivities() {
    return [
      { name: 'Hotel Rest', activityType: 'POOL', startTime: '09:00', endTime: '12:00', priority: 1, notes: 'Take advantage of the hotel pool.' },
      { name: 'Lunch break', activityType: 'DINING', startTime: '12:00', endTime: '13:30', priority: 2, notes: 'Local restaurant near the hotel.' },
      { name: 'Area walk', activityType: 'WALK', startTime: '14:00', endTime: '17:00', priority: 3, notes: 'Explore the surroundings at a relaxed pace.' },
      { name: 'Dinner and rest', activityType: 'DINING', startTime: '18:00', endTime: '20:00', priority: 4, notes: 'Light dinner before resting.' },
    ];
  }
}
