# Frontend Integration Guide — Travel Planner API

## Breaking Changes (migración desde Disney Planner)

Si tenías una integración anterior con el "Disney Planner", estos son los cambios que rompen compatibilidad:

| Área | Antes | Ahora |
|------|-------|-------|
| `dayType` enum | `'DISNEY'`, `'UNIVERSAL'`, `'OTHER_PARK'` | `'THEME_PARK'` (los tres colapsan en uno) |
| `dayType` nuevo valor | — | `'SIGHTSEEING'` (turismo genérico) |
| Parks DTO | `{ disney: [], universal: [], other: [] }` | `{ themeParks: [] }` |
| Autenticación | Sin auth | Header `x-api-key` requerido en todos los requests |
| Rate limiting | Sin límite | 10 req/min en `POST /plan`, 60 req/min en el resto |
| Endpoint parks | `GET /schedule/orlando-parks` | `GET /schedule/parks` |

---

## Autenticación

**Todos los requests** al api-gateway requieren el header:

```
x-api-key: <tu-clave>
```

Las claves válidas están configuradas en la variable de entorno `API_KEYS` del servidor (separadas por coma). Si la clave es inválida o falta:

```json
HTTP 403
{ "error": "invalid_api_key" }
```

---

## Rate Limiting

Por clave de API (no por IP):

| Endpoint | Límite |
|----------|--------|
| `POST /plan` | 10 requests / 60 segundos |
| Resto | 60 requests / 60 segundos |

Al superar el límite: `HTTP 429 Too Many Requests`.

---

## Endpoints

### `POST /plan`

Genera un itinerario completo a partir de una descripción en lenguaje natural.

**Request:**
```http
POST /plan
x-api-key: tu-clave
Content-Type: application/json

{
  "description": "Viaje de 7 días a Orlando con 2 adultos y 1 nena de 6 años, quiero ir a parques de Disney y Universal, presupuesto medio"
}
```

**Response exitosa:**

Devuelve un objeto de calendario con el trip completo. Estructura a nivel conceptual:

```typescript
{
  id: number,
  name: string,              // ej: "Orlando Family Vacation 2026-2027"
  startDate: string,         // "YYYY-MM-DD"
  endDate: string,           // "YYYY-MM-DD"
  description: string | null,
  createdAt: string,
  updatedAt: string,
  travelers: Traveler[],
  days: TripDay[]
}
```

**Response de error (AI no disponible):**
```json
{ "success": false, "error": "ai_unavailable" }
```

---

### `GET /schedule/parks`

Devuelve los parques disponibles desde la ThemeParks API.

**Request:**
```http
GET /schedule/parks
x-api-key: tu-clave
```

**Response:**
```typescript
{
  themeParks: Array<{
    id: string,    // slug único del parque (ej: "magickingdom", "universalstudiosflorida")
    name: string   // nombre legible (ej: "Magic Kingdom")
  }>
}
```

> Nota: Este endpoint soporta múltiples destinos. Por ahora el backend usa `waltdisneyworldresort` como destino por defecto si no se pasa `destinationSlug`.

---

## Tipos y Estructuras

### `DayType` enum

```typescript
type DayType =
  | 'THEME_PARK'   // parque temático (Disney, Universal, Legoland, etc.)
  | 'SHOPPING'     // día de compras
  | 'REST'         // día de descanso
  | 'MIXED'        // combinación de actividades
  | 'SIGHTSEEING'; // turismo urbano (museos, tours, landmarks)
```

> `'DISNEY'`, `'UNIVERSAL'` y `'OTHER_PARK'` ya no existen. Todos son `'THEME_PARK'`.

---

### `Trip`

```typescript
interface Trip {
  id: number;
  name: string;
  startDate: string;        // "YYYY-MM-DD"
  endDate: string;          // "YYYY-MM-DD"
  description: string | null;
  createdAt: string;
  updatedAt: string;
  days: TripDay[];
  travelers: Traveler[];
}
```

---

### `TripDay`

```typescript
interface TripDay {
  id: number;
  dayNumber: number;          // 1-based, secuencial dentro del trip
  date: string;               // "YYYY-MM-DD"
  dayType: DayType;           // ver enum arriba
  locationLabel: string | null; // ej: "Magic Kingdom", "Disney Springs", "City Tour"
  passRecommendation: string | null; // texto libre con recomendación de pase premium (o null)
  createdAt: string;
  updatedAt: string;
  timeBlocks: TimeBlock[];
}
```

**Nota sobre `passRecommendation`:** Ya no es específico de Lightning Lane o Fast Pass. Es un campo de texto libre. La IA puede poner cualquier recomendación relevante para el destino (pase premium, skipline, reserva anticipada, etc.), o `null` si no aplica.

---

### `Traveler`

```typescript
interface Traveler {
  id: number;
  name: string;
  age: number | null;   // útil para restricciones de altura y categoría de tickets
  notes: string | null; // restricciones dietarias, accesibilidad, etc.
  createdAt: string;
  updatedAt: string;
}
```

---

### `Activity`

```typescript
type ActivityType = 'RIDE' | 'SHOW' | 'FOOD' | 'SHOPPING' | 'EXPERIENCE';

interface Activity {
  id: number;
  name: string;
  activityType: ActivityType;
  startTime: string | null;   // "HH:MM"
  endTime: string | null;     // "HH:MM"
  sortOrder: number;          // menor = primero en la lista
  priority: number;           // 1 = prioridad más alta, mayor número = menor prioridad
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
```

---

## Flujo interno (para entender el response)

El `POST /plan` ejecuta en orden:

1. `GET parks` → obtiene lista de parques disponibles
2. `AI: plan_trip` → IA genera estructura del viaje (días, tipos, viajeros)
3. `DB: create_trip` → persiste el trip con viajeros
4. `DB: update_trip_day` → actualiza cada día con tipo/label/recomendación
5. `Scheduler: generate_schedule` → genera bloques horarios para días `THEME_PARK`
6. `AI: enrich_schedule` → enriquece días no-parque con actividades descriptivas
7. `DB: get_calendar` → devuelve la vista completa del trip

---

## Filtrar días por tipo (ejemplo UI)

```typescript
// Días que tienen parque → mostrar horario detallado
const parkDays = trip.days.filter(d => d.dayType === 'THEME_PARK');

// Días de descanso/sightseeing/shopping → mostrar vista simplificada
const leisureDays = trip.days.filter(d => d.dayType !== 'THEME_PARK');
```

---

## Campos no usados en UI todavía (info para futuras features)

- `Traveler.age` → para mostrar restricciones de altura en atracciones
- `Traveler.notes` → para mostrar necesidades especiales
- `Activity.priority` → para re-ordenar o filtrar atracciones por importancia
- `Activity.sortOrder` → el backend ya los devuelve ordenados, pero podés reordenar en UI

---

## Variables de entorno del backend (referencia para DevOps / dev local)

```bash
# api-gateway
API_KEYS=clave1,clave2          # claves válidas separadas por coma
CORS_ORIGIN=http://localhost:5173 # o * para desarrollo
PORT=3000

# trip-service
DB_HOST=localhost
DB_PORT=5432
DB_NAME=travel_planner
DB_USER=postgres
DB_PASSWORD=...

# ai-service
ANTHROPIC_API_KEY=sk-ant-...

# scheduler-service
THEMEPARKS_API=https://api.themeparks.wiki/v1
```
