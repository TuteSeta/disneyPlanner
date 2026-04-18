import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import Anthropic from '@anthropic-ai/sdk';
import { firstValueFrom } from 'rxjs';
import { EnrichScheduleDto } from './dto/enrich-schedule.dto';
import { PlanTripDto } from './dto/plan-trip.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly anthropic: Anthropic;
  private readonly tripClient: ClientProxy;

  constructor(private readonly config: ConfigService) {
    this.anthropic = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
    });

    this.tripClient = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: { host: '127.0.0.1', port: 4001 },
    });
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
                  area: dto.dayType === 'REST' ? 'Relaxation' : 'Shopping District',
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
    const prompt = this.buildPlanPrompt(dto);
    this.logger.log(`Planning trip from description (${dto.description.length} chars)`);

    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (message.content[0] as { type: string; text: string }).text;
    const plan = this.parseJsonObject(text);
    this.logger.log(`Plan generated: ${plan.days?.length ?? 0} days`);
    return plan;
  }

  private buildPlanPrompt(dto: PlanTripDto): string {
    const today = new Date().toISOString().split('T')[0];
    const parksJson = dto.availableParks
      ? JSON.stringify(dto.availableParks, null, 2)
      : 'null (no disponibles — devolvé parkId vacío)';

    return `Eres un experto planificador de vacaciones en Orlando, Florida.

Hoy es ${today}. El usuario escribió esta descripción de su viaje:

"""
${dto.description}
"""

Parques disponibles (usa exactamente estos IDs cuando asignes un parque a un día):
${parksJson}

Tu tarea: devolver un plan completo de viaje en formato JSON (solo JSON, sin texto adicional, sin markdown).

Reglas:
- Inferí las fechas absolutas (YYYY-MM-DD). Si el usuario dice "22 de diciembre al 7 de enero" y la fecha ya pasó este año, usá el próximo ciclo.
- Generá un objeto "travelers" con el arreglo exacto. Si el usuario dice "11 personas (2 niños y 9 adultos)", creá 11 entries con nombres genéricos ("Adulto 1", "Niño 1", etc.) y edad aproximada (adulto=30, niño=8).
- Distribuí los días según lo que pidió el usuario. Para viajes largos (10+ días) intercalá descansos.
- Para días de parque, elegí el parque que tenga más sentido por orden de visita, clima, día de la semana. No repitas parques a menos que el viaje sea muy largo.
- Para DISNEY: recomendá Lightning Lane solo si el día es de alta demanda (fin de semana, Navidad, feriados, atracciones populares). Si lo recomendás, explicá brevemente por qué.
- Para UNIVERSAL: recomendá Fast Pass con los mismos criterios.
- Para SHOPPING y REST, inferí el budget del texto ("normal" → "medium").
- intensity: "relaxed" si hay niños o adultos mayores, "normal" por default, "aggressive" si pidieron "ver todo".

Devolvé este JSON exacto:

{
  "trip": {
    "name": "string — nombre sugerido del viaje, DEBE incluir los años que corresponden a startDate y endDate (ej: si startDate=2026-12-22 y endDate=2027-01-07, usar '2026-2027', nunca inventar años)",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "description": "string — 1 oración resumen",
    "travelers": [
      { "name": "string", "age": number }
    ]
  },
  "preferences": {
    "intensity": "relaxed" | "normal" | "aggressive",
    "hasKids": boolean
  },
  "days": [
    {
      "dayNumber": number,
      "date": "YYYY-MM-DD",
      "dayType": "DISNEY" | "UNIVERSAL" | "REST" | "SHOPPING",
      "locationLabel": "string — ej: 'Magic Kingdom', 'Disney Springs', 'Hotel + Spa'",
      "parkId": "string — solo para DISNEY/UNIVERSAL, usar ID exacto de la lista",
      "passRecommendation": "string | null — solo DISNEY/UNIVERSAL; explicar por qué recomendás Lightning Lane/Fast Pass o null si no vale la pena",
      "budget": "low" | "medium" | "high" | null
    }
  ]
}

Responde ÚNICAMENTE con el JSON, sin bloques de código, sin texto extra.`;
  }

  private parseJsonObject(text: string) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      this.logger.error('No JSON object found in response', text);
      throw new Error('Claude response did not contain a valid JSON object');
    }
    return JSON.parse(match[0]);
  }

  private async generateActivities(dto: EnrichScheduleDto) {
    const prompt = this.buildPrompt(dto);

    const message = await this.anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (message.content[0] as { type: string; text: string }).text;
    return this.parseActivities(text);
  }

  private buildPrompt(dto: EnrichScheduleDto): string {
    const budgetDescriptions = {
      low: 'bajo presupuesto (gratuito o económico)',
      medium: 'presupuesto moderado',
      high: 'presupuesto alto, experiencias premium',
    };

    const typeDescriptions = {
      REST: 'día de descanso y relax cerca de Orlando',
      SHOPPING: 'día de compras en Orlando',
    };

    return `Eres un experto en viajes a Orlando, Florida.
El viajero tiene un ${typeDescriptions[dto.dayType]} con ${budgetDescriptions[dto.budget]}.

Genera exactamente 4 actividades recomendadas en formato JSON array.
Cada actividad debe tener estos campos exactos:
- name: string (nombre de la actividad)
- activityType: string (ej: "DINING", "SHOPPING", "SPA", "POOL", "WALK", "EXPERIENCE")
- startTime: string (formato "HH:MM", distribuidas entre 09:00 y 21:00)
- endTime: string (formato "HH:MM")
- priority: number (1-4, siendo 1 la más importante)
- notes: string (recomendación breve de 1 oración)

Responde ÚNICAMENTE con el JSON array, sin texto adicional.`;
  }

  private parseActivities(text: string) {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON array found');
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      this.logger.error('Failed to parse Claude response', e);
      return this.fallbackActivities();
    }
  }

  private fallbackActivities() {
    return [
      { name: 'Descanso en hotel', activityType: 'POOL', startTime: '09:00', endTime: '12:00', priority: 1, notes: 'Aprovecha la piscina del hotel.' },
      { name: 'Almuerzo tranquilo', activityType: 'DINING', startTime: '12:00', endTime: '13:30', priority: 2, notes: 'Restaurante local cerca del hotel.' },
      { name: 'Paseo por el área', activityType: 'WALK', startTime: '14:00', endTime: '17:00', priority: 3, notes: 'Explora los alrededores sin prisas.' },
      { name: 'Cena y descanso', activityType: 'DINING', startTime: '18:00', endTime: '20:00', priority: 4, notes: 'Cena ligera antes de descansar.' },
    ];
  }
}
