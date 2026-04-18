<div align="center">
  <h1>🏰 My Disney Planner<br><sup>AI Trip Scheduler for Orlando</sup></h1>
  <p>A production-grade, microservices-based backend system for generating optimized, multi-day Disney park itineraries based on user preferences, constraints, and deterministic scheduling rules.</p>

  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/TypeORM-FE0902?style=for-the-badge&logo=typeorm&logoColor=white" alt="TypeORM">
</div>

## 📖 Overview

**My Disney Planner** is not a toy project. It is a portfolio-ready, production-oriented scalable system designed to demonstrate real-world backend architecture, clean design, and complex deterministic scheduling logic for tech interviews and production usage.

The core goal is to generate optimized Disney park schedules. It handles complex constraints like exact travel dates, preferred parks, priority attractions, fatigue/intensity limits, and even minimizes walking distances by cleverly grouping activities by geographical area.

---

## 🎯 Core Functionality

The system goes beyond producing a simple, flat list of activities. It performs deep optimization and deterministic planning:

1. **Accepts Rich User Inputs:** Adjusts to number of days, dates, preferred parks, activity preferences, intensity levels (relaxed/normal/aggressive), priority attractions, and user constraints (kids, fatigue, time limits).
2. **Generates Full Itineraries:** Assigns parks per day, distributes activities across time slots, avoids conflicts, and optimizes the overall experience.
3. **Full Re-planning:** Allows complete regeneration of itineraries when inputs change. It recalculates entirely rather than patching an existing plan.

### 🧠 The Scheduler Engine (Deterministic & Rule-Based)

The scheduling logic is **100% deterministic, explainable, and rule-based**. 

> ⚠️ **IMPORTANT CONSTRAINT**: AI is **NOT** used to generate schedules. It is only used to explain decisions and suggest improvements based on the deterministic output. Randomness is strictly forbidden.

### 🧱 Core Innovation: Day Segmentation & Mini-Groups

Each day is structured into **Time Blocks** (Morning, Midday, Afternoon, Evening/Night). 
Within these blocks, activities are clustered into **Mini-Groups** based on geographic proximity.

- **Mini-Groups**: Contain 2–4 activities in the *same park area* (e.g., Tomorrowland).
- **Why it matters**: Minimizes walking distance, clusters activities logically, simulates real human movement, avoids chaotic backtracking, and drastically improves user experience.

---

## ⚙️ Scheduler Pipeline

The engine follows a strict 8-step pipeline:

1. **Assign Parks to Days**: Distribute parks considering preferences, intensity, and avoiding unnecessary repetition.
2. **Load Park Dataset**: Ingest attractions with exactly scoped data: name, park, area, duration, opening hours, type, and priority score.
3. **Rank Activities**: Score based on user must-dos, popularity, and estimated waits.
4. **Time Block Division**: Split day into Morning (09:00–12:00), Midday (12:00–15:00), Afternoon (15:00–18:00), and Night.
5. **Create Mini-Groups**: Group by area first, then priority, keeping group size tight (2-4), while respecting time constraints.
6. **Assign Time Slots**: Ensure no overlap, adding walking/waiting buffers and respecting fixed show times.
7. **Conflict Resolution**: Drop lowest-priority activities or reschedule to handle lack of time or excessive load.
8. **Optimization Goals**: Maximize completed priorities and user satisfaction; minimize walking, idle time, and stress.

---

## 🏗 Architecture & Tech Stack

This project uses a production-ready microservices architecture within an npm monorepo setup (Dockerized).

- **Backend**: NestJS (TypeScript)
- **Database**: PostgreSQL with TypeORM
- **Infrastructure**: Dockerized services

### Microservices

- **🌐 API Gateway** (`apps/api-gateway`): Routes external traffic to backend logic.
- **🎒 Trip Service** (`apps/trip-service`): Manages user data, trips, and basic planning setup/storage.
- **⏱️ Scheduler Service** (`apps/scheduler-service`): The core engine containing the deterministic, rule-based scheduling pipeline.
- **🤖 AI Recommendation Service** (`apps/ai-service`): Adapts plans to user language and explains *why* the rules engine made specific grouping decisions (e.g., *"We grouped these activities in Tomorrowland to minimize walking time"*).

### 🧩 Data Model

Relationships forming the deterministic structure:
- `Trip` ➔ `Days`
- `Day` ➔ `Park`, `TimeBlocks`
- `TimeBlock` ➔ `ActivityGroups`
- `ActivityGroup` ➔ `Activities`

---

## 📦 Output Format

The final product of the scheduler is a structured JSON response containing the segmented day logic:

```json
{
  "trip": {
    "days": [
      {
        "date": "2026-06-01",
        "park": "Magic Kingdom",
        "blocks": [
          {
            "type": "morning",
            "groups": [
              {
                "area": "Tomorrowland",
                "activities": [
                  "Space Mountain",
                  "Buzz Lightyear",
                  "PeopleMover"
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

## 🚀 Getting Started

1. Clone the repository & Install dependencies:
   ```bash
   git clone <repository-url>
   cd my-disney-planner
   npm install
   ```

2. Run the services via configured npm scripts:
   ```bash
   # In separate terminal windows or using a runner
   npm run start:gateway
   npm run start:trip
   npm run start:scheduler
   npm run start:ai
   ```

## 📝 License

Distributed under the MIT License.
