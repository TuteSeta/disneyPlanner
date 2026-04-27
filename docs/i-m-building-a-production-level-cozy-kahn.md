# AI Travel Planner — Production Design Plan

## Context

The backend already has a working microservices foundation (trip-service, scheduler-service, ai-service, api-gateway). The three problem areas are well-defined by the exploration:

1. **Planning engine** is functional but destination-locked (hardcoded Orlando slugs) and ignores several declared constraints (`hasKids`, `budget`).
2. **LLM integration** uses fragile regex-based JSON parsing, no output schema validation, no result caching, no retries.
3. **Cost control is absent**: no API key auth, no rate limiting, no token budget, no cost visibility.

This plan delivers all three in three focused phases. Each phase is independently shippable and testable.

---

## Phase 1 — Generalized Constraint-Based Planning Engine

**Target service:** `apps/scheduler-service`

### What changes

#### 1. Remove destination hardcoding

**File:** `apps/scheduler-service/src/modules/scheduler/parks/parks.service.ts` (lines 60-70)

Replace `getAllOrlandoParks()` with:
```typescript
async getParksForDestination(destinationSlug: string): Promise<Park[]>
```
Remove the three hardcoded slug arrays (`waltdisneyworldresort`, `universalorlando`, `OTHER_ORLANDO_SLUGS`). Accept `destinationSlug` from the request DTO and pass it to the ThemeParks API call.

Keep `getAllOrlandoParks()` as a thin wrapper calling `getParksForDestination('waltdisneyworldresort')` for backwards compatibility until the api-gateway is updated.

#### 2. Add `destinationSlug` to the schedule DTO

**File:** `apps/scheduler-service/src/modules/scheduler/dto/generate-schedule.dto.ts`

Add at the `GenerateScheduleDto` level (not per-day):
```typescript
@IsString()
@IsOptional()
destinationSlug?: string;  // defaults to 'waltdisneyworldresort' if omitted
```

#### 3. Add `budget` constraint and wire `hasKids`

**File:** `apps/scheduler-service/src/modules/scheduler/dto/generate-schedule.dto.ts`

In `SchedulePreferencesDto`, add:
```typescript
@IsEnum(['low', 'medium', 'high'])
@IsOptional()
budget?: 'low' | 'medium' | 'high';
```

#### 4. Wire `hasKids` into Activity Ranker

**File:** `apps/scheduler-service/src/modules/scheduler/pipeline/steps/activity-ranker.step.ts` (lines 7-35)

Add scoring rule:
- If `preferences.hasKids === true` AND attraction name contains family-friendly keywords (`Junior`, `Family`, `Kiddie`, `Children`, `Little`) → +25 score
- If `preferences.hasKids === true` AND `entityType === 'SHOW'` → +15 score (shows work better with kids)

#### 5. Add budget-aware filtering to Conflict Resolver

**File:** `apps/scheduler-service/src/modules/scheduler/pipeline/steps/conflict-resolver.step.ts`

Budget multipliers:
```typescript
const ACTIVITIES_PER_BLOCK = { low: 2, medium: 3, high: 4 }
```
After existing overflow check, apply a second trim: cap activities per block at `ACTIVITIES_PER_BLOCK[budget ?? 'medium']`. Low budget = fewer paid activities per block.

#### 6. Introduce `PlanningContext` type

**File:** `apps/scheduler-service/src/modules/scheduler/pipeline/types/pipeline.types.ts`

Add:
```typescript
export interface PlanningContext {
  tripId: number;
  destinationSlug: string;
  preferences: ResolvedPreferences;
  days: DayAssignment[];
}
```
Pass `PlanningContext` through `PipelineService.run()` instead of the current split parameters. Each step receives the full context.

### Files modified
| File | Change |
|------|--------|
| `parks/parks.service.ts` | Add `getParksForDestination(slug)`, keep Orlando wrapper |
| `dto/generate-schedule.dto.ts` | Add `destinationSlug`, add `budget` to preferences |
| `pipeline/steps/activity-ranker.step.ts` | Wire `hasKids` scoring |
| `pipeline/steps/conflict-resolver.step.ts` | Add budget-cap filter |
| `pipeline/types/pipeline.types.ts` | Add `PlanningContext` interface |
| `pipeline/pipeline.service.ts` | Thread `PlanningContext` through all steps |

### Verification
```bash
# Call generate_schedule with destinationSlug = 'universalorlando' — should return Universal parks
# Call with hasKids=true — priority attractions should score higher for kid-friendly rides
# Call with budget='low' — fewer activities per block than budget='high'
```

---

## Phase 2 — Efficient LLM Integration

**Target service:** `apps/ai-service`

### What changes

#### 1. Zod schemas for Claude outputs

**New file:** `apps/ai-service/src/ai/schemas/claude-output.schemas.ts`

```typescript
export const PlanTripOutputSchema = z.object({
  trip: z.object({ name: z.string(), startDate: z.string(), endDate: z.string() }),
  preferences: z.object({ intensity: z.enum(['relaxed','normal','aggressive']), budget: z.enum(['low','medium','high']) }),
  days: z.array(z.object({ date: z.string(), dayType: z.string(), parkId: z.string().optional() }))
});

export const ActivityArraySchema = z.array(z.object({
  name: z.string(),
  activityType: z.string(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  priority: z.number().int().min(1).max(10),
  notes: z.string()
}));
```

Replace `parseJsonObject()` and `parseActivities()` in `ai.service.ts` with schema-validated parsing:
```typescript
const parsed = PlanTripOutputSchema.safeParse(JSON.parse(jsonMatch[0]));
if (!parsed.success) throw new AiOutputValidationError(parsed.error);
```

#### 2. Retry utility with exponential backoff

**New file:** `apps/ai-service/src/ai/utils/retry.util.ts`

```typescript
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 800
): Promise<T>
```
On `AnthropicError` with status 429 or 529 (overloaded) → retry with `baseDelayMs * 2^attempt` delay. On 400/401 → throw immediately (no retry — configuration error).

Wrap both `anthropic.messages.create()` calls in `ai.service.ts` with this utility.

#### 3. In-memory result cache

**New file:** `apps/ai-service/src/ai/cache/plan-cache.service.ts`

```typescript
@Injectable()
export class PlanCacheService {
  private readonly cache = new Map<string, { value: unknown; expiresAt: number }>();
  
  get(key: string): unknown | null
  set(key: string, value: unknown, ttlMs: number): void
  buildKey(...parts: string[]): string  // sha256 hash of joined parts
}
```

In `ai.service.ts`:
- `planTrip()`: cache key = `sha256(description + parksJson)`, TTL = 4 hours
- `generateActivities()`: cache key = `sha256(dayType + budgetLevel + location)`, TTL = 2 hours

Check cache before calling Claude. On hit → return cached result, log `cache_hit`.

#### 4. Graceful degradation for `planTrip()`

After retries exhausted in `planTrip()`:
- Log structured error with request ID
- Throw `AiUnavailableException` (custom NestJS `RpcException`)
- api-gateway's planner-service catches it and returns `{ success: false, error: 'ai_unavailable' }` to the HTTP client instead of a 500

The `generateActivities()` fallback already exists — keep it, but remove Spanish hardcoding. Return type keys only:
```typescript
[{ name: 'Hotel Rest', activityType: 'POOL', ... }]
```

#### 5. Externalize prompts

**New files:**
- `apps/ai-service/src/ai/prompts/plan-trip.system.txt`
- `apps/ai-service/src/ai/prompts/enrich-schedule.system.txt`

Load via `fs.readFileSync` at `AiService` constructor. Move the current string constants `PLAN_TRIP_SYSTEM` and `ENRICH_SYSTEM` verbatim into these files. Now prompts are tunable without recompilation.

### Files modified/created
| File | Change |
|------|--------|
| `schemas/claude-output.schemas.ts` (new) | Zod schemas for both Claude output types |
| `utils/retry.util.ts` (new) | `withRetry()` with exponential backoff |
| `cache/plan-cache.service.ts` (new) | In-memory result cache with TTL |
| `prompts/plan-trip.system.txt` (new) | Externalized system prompt |
| `prompts/enrich-schedule.system.txt` (new) | Externalized system prompt |
| `ai/ai.service.ts` | Replace regex parse → Zod; add retry; add cache; load prompts from files |

### Verification
```bash
# Call plan_trip twice with same input → second call returns cache_hit in logs
# Kill ANTHROPIC_API_KEY → should get AiUnavailableException, not 500
# Pass malformed Claude response mock → Zod parse error logged, fallback triggered
```

---

## Phase 3 — Cost Control

**Target service:** `apps/api-gateway` + minor additions to `apps/ai-service`

### What changes

#### 1. API Key authentication

**New file:** `apps/api-gateway/src/common/guards/api-key.guard.ts`

```typescript
@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const key = req.headers['x-api-key'];
    const validKeys = process.env.API_KEYS?.split(',') ?? [];
    return validKeys.includes(key);
  }
}
```

Apply `@UseGuards(ApiKeyGuard)` to the planner controller (all routes). Returns `403` with `{ error: 'invalid_api_key' }` on failure.

This is a MVP implementation — keys in env var `API_KEYS=key1,key2`. No DB needed to start.

#### 2. Rate limiting

Install `@nestjs/throttler`. Add to `AppModule`:
```typescript
ThrottlerModule.forRoot([{ name: 'short', ttl: 60000, limit: 10 }])
```
Apply `ThrottlerGuard` globally. Override limit per endpoint:
- `POST /plan` → 10 requests/minute (expensive — full AI call)
- Other routes → 60 requests/minute (default)

Custom key generator: hash `X-API-Key` header so limits are per-client, not per-IP.

**File modified:** `apps/api-gateway/src/app.module.ts`

#### 3. Token budget enforcement

**In api-gateway** `apps/api-gateway/src/modules/planner/planner.service.ts` (line 109):

Before calling `enrich_schedule`, calculate:
```typescript
const maxTokens = Math.min(days.filter(d => d.dayType !== 'DISNEY').length * 400, 1500);
```
Pass `maxTokens` in the `EnrichScheduleDto` to ai-service.

**In ai-service** `ai/ai.service.ts` (line 167):

Replace hardcoded `max_tokens: 1024` with `dto.maxTokens ?? 1024`.

Same pattern for `planTrip` — accept optional `maxTokens` from planner-service (`dto.maxTokens ?? 2048`).

#### 4. Structured cost log

After every successful `anthropic.messages.create()` call in `ai.service.ts`, add:
```typescript
this.logger.log(JSON.stringify({
  event: 'ai_call',
  type: 'plan_trip' | 'enrich_schedule',
  model: message.model,
  inputTokens: message.usage.input_tokens,
  outputTokens: message.usage.output_tokens,
  cacheHit: false,
  estimatedCostUSD: (input * 0.00000025 + output * 0.00000125).toFixed(6),
}));
```
This is structured stdout. Any log aggregator (Datadog, CloudWatch, Loki) can parse it. No DB schema needed for MVP.

#### 5. Security baseline in api-gateway

**File:** `apps/api-gateway/src/main.ts`

Add:
```typescript
app.use(helmet());
app.enableCors({ origin: process.env.CORS_ORIGIN ?? '*' });
```

Install `helmet` if not already present.

### Files modified/created
| File | Change |
|------|--------|
| `common/guards/api-key.guard.ts` (new) | `X-API-Key` guard, MVP env-based keys |
| `app.module.ts` | Add `ThrottlerModule` |
| `main.ts` | Add `helmet()`, `enableCors()` |
| `modules/planner/planner.service.ts` | Calculate + forward `maxTokens` |
| `ai/ai.service.ts` | Accept `maxTokens` override; add cost log |

### Verification
```bash
# Request without X-API-Key → 403
# 11 requests in 60s to POST /plan with valid key → 11th gets 429
# Check logs for { "event": "ai_call", "estimatedCostUSD": "..." } after each plan
```

---

## Execution Order

```
Phase 1 (Scheduler)  →  Phase 2 (AI Service)  →  Phase 3 (Gateway)
```

Phases 1 and 2 are independent — can be parallelized if desired. Phase 3 has a minor dependency on Phase 2 (`maxTokens` field in DTOs).

---

## Critical Files Reference

| Service | Key File | Role |
|---------|----------|------|
| scheduler | `pipeline/pipeline.service.ts` | Orchestrates all 6 steps |
| scheduler | `pipeline/steps/activity-ranker.step.ts` | Scoring — add `hasKids` here |
| scheduler | `pipeline/steps/conflict-resolver.step.ts` | Overflow trim — add budget cap here |
| scheduler | `parks/parks.service.ts:60-70` | Hardcoded Orlando slugs — remove here |
| ai-service | `ai/ai.service.ts` | Core Claude integration — most changes land here |
| ai-service | `ai/ai.controller.ts` | TCP message patterns `plan_trip`, `enrich_schedule` |
| api-gateway | `modules/planner/planner.service.ts` | Orchestrates all microservice calls |
| api-gateway | `app.module.ts` | Global module setup — add Throttler here |
| api-gateway | `main.ts` | App bootstrap — add helmet/cors here |
