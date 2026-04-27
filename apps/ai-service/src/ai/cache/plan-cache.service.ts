import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

/**
 * In-memory result cache with TTL support.
 *
 * Uses a Map internally — no Redis needed for MVP.
 * Keys are SHA-256 hashes of the cache key parts to keep them short and collision-free.
 *
 * Note: cache is per-instance (not shared across restarts or replicas).
 * For production with multiple replicas, replace with a Redis-backed implementation.
 */
@Injectable()
export class PlanCacheService {
  private readonly cache = new Map<string, CacheEntry>();

  get(key: string): unknown | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: unknown, ttlMs: number): void {
    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  /**
   * Builds a deterministic cache key from one or more string parts.
   * Parts are joined with '|' then SHA-256 hashed.
   */
  buildKey(...parts: string[]): string {
    return createHash('sha256').update(parts.join('|')).digest('hex');
  }
}
