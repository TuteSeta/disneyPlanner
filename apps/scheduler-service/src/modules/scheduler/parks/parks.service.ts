import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ParkAttraction } from '../pipeline/types/pipeline.types';

interface ThemeParksChild {
  id: string;
  name: string;
  entityType: string;
}

interface ThemeParksLiveItem {
  id: string;
  status: string;
  queue?: { STANDBY?: { waitTime: number } };
}

@Injectable()
export class ParksService {
  private readonly logger = new Logger(ParksService.name);
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = config.get<string>('THEMEPARKS_API')!;
  }

  async getAttractionsForPark(parkId: string): Promise<ParkAttraction[]> {
    const [children, liveMap] = await Promise.all([
      this.fetchChildren(parkId),
      this.fetchLiveMap(parkId),
    ]);

    return children
      .filter((c) => this.isSchedulable(c.entityType))
      .map((c) => {
        const live = liveMap.get(c.id);
        return {
          id: c.id,
          name: c.name,
          area: c.entityType === 'SHOW' ? 'Shows & Entertainment' : 'Attractions',
          entityType: c.entityType as ParkAttraction['entityType'],
          status: (live?.status ?? 'OPERATING') as ParkAttraction['status'],
          waitTime: live?.queue?.STANDBY?.waitTime ?? 0,
        };
      })
      .filter((a) => a.status === 'OPERATING');
  }

  async getAllOrlandoParks(): Promise<{
    disney: { id: string; name: string }[];
    universal: { id: string; name: string }[];
  }> {
    const res = await fetch(`${this.baseUrl}/destinations`);
    const data = (await res.json()) as {
      destinations?: { slug: string; parks?: ThemeParksChild[] }[];
    };

    const destinations = data.destinations ?? [];

    const wdw = destinations.find((d) => d.slug === 'waltdisneyworldresort');
    const universal = destinations.find((d) => d.slug === 'universalorlando');

    const [disney, universalParks] = await Promise.all([
      this.keepOperating(wdw?.parks ?? []),
      this.keepOperating(universal?.parks ?? []),
    ]);

    return { disney, universal: universalParks };
  }

  private async keepOperating(
    parks: ThemeParksChild[],
  ): Promise<{ id: string; name: string }[]> {
    const checks = await Promise.all(
      parks.map(async (p) => {
        const liveMap = await this.fetchLiveMap(p.id);
        const hasOperating = Array.from(liveMap.values()).some(
          (item) => item.status === 'OPERATING',
        );
        return { park: p, hasOperating };
      }),
    );

    return checks
      .filter(({ park, hasOperating }) => {
        if (!hasOperating) {
          this.logger.log(`Skipping ${park.name} — no operating attractions`);
        }
        return hasOperating;
      })
      .map(({ park }) => ({ id: park.id, name: park.name }));
  }

  private async fetchChildren(entityId: string): Promise<ThemeParksChild[]> {
    try {
      const res = await fetch(`${this.baseUrl}/entity/${entityId}/children`);
      const data = (await res.json()) as { children?: ThemeParksChild[] };
      return data.children ?? [];
    } catch (err) {
      this.logger.warn(`Failed to fetch children for ${entityId}: ${err}`);
      return [];
    }
  }

  private async fetchLiveMap(parkId: string): Promise<Map<string, ThemeParksLiveItem>> {
    try {
      const res = await fetch(`${this.baseUrl}/entity/${parkId}/live`);
      const data = (await res.json()) as { liveData?: ThemeParksLiveItem[] };
      return new Map((data.liveData ?? []).map((item) => [item.id, item]));
    } catch (err) {
      this.logger.warn(`Failed to fetch live data for ${parkId}: ${err}`);
      return new Map();
    }
  }

  private isSchedulable(entityType: string): boolean {
    return ['ATTRACTION', 'SHOW', 'EXPERIENCE'].includes(entityType);
  }
}
