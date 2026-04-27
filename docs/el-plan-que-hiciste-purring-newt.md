# Gap Analysis — Disney Planner → Travel Planner

## Context

El plan anterior tenía 3 fases bien definidas: generalizar el scheduler, mejorar LLM integration, y agregar Cost Control. Esas fases tocaron `scheduler-service`, `ai-service` y `api-gateway`. El `trip-service` — el único con BD real — no fue incluido. Eso no fue un error de diseño del plan, sino que el plan estaba enfocado en capas de negocio, no en el modelo de datos. Pero ahora que esas capas están (o deben estar) generalizadas, el modelo de datos sigue teniendo valores Disney hardcodeados en PostgreSQL.

---

## Qué hizo el plan anterior (referencia)

| Fase | Servicio | Qué generalizó |
|------|----------|----------------|
| 1 | scheduler-service | `destinationSlug` configurable, budget/hasKids, PlanningContext |
| 2 | ai-service | Zod schemas, retry, cache, prompts externos |
| 3 | api-gateway | API key guard, rate limiting, token budget, helmet |

---

## Lo que FALTA para ser Travel Planner

### 1. trip-service — La raíz del problema (NO tocado)

**El enum de PostgreSQL sigue siendo Disney:**
```sql
-- En la DB ahora mismo:
CREATE TYPE "trip_day_daytype_enum" AS ENUM('DISNEY', 'UNIVERSAL', 'SHOPPING', 'REST', 'MIXED')
-- Luego se agregó:
ALTER TYPE "trip_day_daytype_enum" ADD VALUE 'OTHER_PARK'
```

**Archivo:** `apps/trip-service/src/modules/trips/enums/day-type.enum.ts`
```typescript
export enum DayType {
  DISNEY = 'DISNEY',        // ← debe ser THEME_PARK o ATTRACTION
  UNIVERSAL = 'UNIVERSAL',  // ← idem
  OTHER_PARK = 'OTHER_PARK',
  SHOPPING = 'SHOPPING',
  REST = 'REST',
  MIXED = 'MIXED',
}
```

**Problema DB real:** PostgreSQL no permite DROP/RENAME de valores de un ENUM en una transacción normal. La estrategia correcta es crear el nuevo tipo y hacer una migración en dos pasos.

**Archivos afectados en trip-service:**
- `enums/day-type.enum.ts` — definición del enum
- `entities/trip-day.entity.ts` — usa `DayType`, además tiene comentarios con "Magic Kingdom", "Lightning Lane"
- `dto/update-trip-day.dto.ts` — usa `DayType`
- `migrations/1776453353176-Migration.ts` — crea enum con 'DISNEY', 'UNIVERSAL'
- `migrations/1776551491559-AddOtherParkDayType.ts` — agrega 'OTHER_PARK' al mismo enum

### 2. Residuos Disney en servicios YA modificados por el plan

Aunque el plan generalizó la lógica, no limpió todos los valores hardcodeados de Disney. Estos pueden haber sobrevivido al apply:

| Archivo | Problema |
|---------|----------|
| `scheduler-service/dto/generate-schedule.dto.ts` | `@IsEnum(['DISNEY', 'UNIVERSAL', ...])` |
| `scheduler-service/pipeline/types/pipeline.types.ts` | `DayType = 'DISNEY' \| 'UNIVERSAL' \| ...` |
| `ai-service/dto/plan-trip.dto.ts` | Propiedades `disney: ParkOptionDto[]`, `universal: ParkOptionDto[]` |
| `ai-service/schemas/claude-output.schemas.ts` | `z.enum(['DISNEY', 'UNIVERSAL', ...])` |
| `ai-service/prompts/plan-trip.system.txt` | Todo el prompt habla de Orlando, Lightning Lane, Fast Pass |
| `api-gateway/modules/planner/planner.service.ts` | `dayType === 'DISNEY' \| 'UNIVERSAL'` en filtro line 108 |
| `api-gateway/modules/scheduler/scheduler.controller.ts` | Método `getOrlandoParks()` |

---

## Plan de implementación

### Fase A — trip-service: Migración del enum DB

**Objetivo:** Reemplazar `DISNEY`/`UNIVERSAL` por valores genéricos.

**Nuevo enum propuesto:**
```typescript
export enum DayType {
  THEME_PARK = 'THEME_PARK',    // reemplaza DISNEY + UNIVERSAL + OTHER_PARK
  SHOPPING = 'SHOPPING',
  REST = 'REST',
  MIXED = 'MIXED',
  SIGHTSEEING = 'SIGHTSEEING',  // nuevo — viaje genérico no parque
}
```

**Migración (TypeORM):**
```sql
-- 1. Crear nuevo tipo
CREATE TYPE "trip_day_daytype_enum_new" AS ENUM('THEME_PARK', 'SHOPPING', 'REST', 'MIXED', 'SIGHTSEEING');

-- 2. Migrar columna con casting
ALTER TABLE trip_day
  ALTER COLUMN "dayType" TYPE "trip_day_daytype_enum_new"
  USING (
    CASE "dayType"
      WHEN 'DISNEY'     THEN 'THEME_PARK'::"trip_day_daytype_enum_new"
      WHEN 'UNIVERSAL'  THEN 'THEME_PARK'::"trip_day_daytype_enum_new"
      WHEN 'OTHER_PARK' THEN 'THEME_PARK'::"trip_day_daytype_enum_new"
      WHEN 'SHOPPING'   THEN 'SHOPPING'::"trip_day_daytype_enum_new"
      WHEN 'REST'       THEN 'REST'::"trip_day_daytype_enum_new"
      WHEN 'MIXED'      THEN 'MIXED'::"trip_day_daytype_enum_new"
    END
  );

-- 3. Drop viejo, renombrar nuevo
DROP TYPE "trip_day_daytype_enum";
ALTER TYPE "trip_day_daytype_enum_new" RENAME TO "trip_day_daytype_enum";
```

**Archivos a modificar en trip-service:**
- `enums/day-type.enum.ts` — nuevo enum
- `entities/trip-day.entity.ts` — limpiar comentarios Disney
- `dto/update-trip-day.dto.ts` — actualizar `@IsEnum`
- Nueva migración TypeORM con SQL arriba

### Fase B — Limpieza cross-service (sin DB)

Actualizar referencias Disney restantes en los servicios que el plan ya tocó:

**scheduler-service:**
- `dto/generate-schedule.dto.ts`: actualizar `@IsEnum` con nuevos valores
- `pipeline/types/pipeline.types.ts`: actualizar `DayType` type literal

**ai-service:**
- `dto/plan-trip.dto.ts`: renombrar `disney`/`universal` → `themeParks: ParkOptionDto[]`
- `schemas/claude-output.schemas.ts`: actualizar Zod enum
- `prompts/plan-trip.system.txt`: reescribir prompt genérico (sin Orlando, Lightning Lane, Fast Pass)

**api-gateway:**
- `modules/planner/planner.service.ts`: actualizar filtro line 108 a `dayType === 'THEME_PARK'`
- `modules/scheduler/scheduler.controller.ts`: renombrar `getOrlandoParks()` → `getAvailableParks()`

---

## Orden de ejecución

```
Fase A (trip-service enum + migration) → Fase B (cross-service cleanup)
```

Fase A primero porque el enum en DB define el contrato. Una vez que `THEME_PARK` existe en DB y en el enum TypeScript, todos los demás servicios pueden actualizarse a ese valor.

---

## Verificación

1. `docker compose up` — BD arranca sin errores
2. Migrations corren y columna `dayType` tiene valores `THEME_PARK`/`SHOPPING`/`REST`
3. `POST /plan` con un trip que tenga días de tipo `THEME_PARK` — flujo completo sin errores
4. No queda ningún `grep -r "DISNEY\|UNIVERSAL\|Orlando\|Magic Kingdom\|Lightning Lane"` en el código (excepto README si existe)

---

## Archivos críticos

| Servicio | Archivo | Cambio |
|---------|---------|--------|
| trip-service | `enums/day-type.enum.ts` | Reemplazar enum completo |
| trip-service | `entities/trip-day.entity.ts` | Limpiar comentarios |
| trip-service | `dto/update-trip-day.dto.ts` | Actualizar @IsEnum |
| trip-service | `migrations/new-*.ts` (crear) | Migración ALTER TYPE |
| scheduler-service | `dto/generate-schedule.dto.ts` | Actualizar @IsEnum |
| scheduler-service | `pipeline/types/pipeline.types.ts` | Actualizar DayType |
| ai-service | `dto/plan-trip.dto.ts` | Renombrar disney/universal |
| ai-service | `schemas/claude-output.schemas.ts` | Actualizar Zod enum |
| ai-service | `prompts/plan-trip.system.txt` | Reescribir prompt genérico |
| api-gateway | `modules/planner/planner.service.ts` | Actualizar filtro dayType |
| api-gateway | `modules/scheduler/scheduler.controller.ts` | Renombrar método |
