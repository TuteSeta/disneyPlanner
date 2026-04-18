FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/scheduler-service/package.json ./apps/scheduler-service/

RUN npm ci --workspace=apps/scheduler-service

COPY apps/scheduler-service ./apps/scheduler-service

RUN npm run build --workspace=apps/scheduler-service

FROM node:20-alpine AS production
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/scheduler-service/package.json ./apps/scheduler-service/

RUN npm ci --workspace=apps/scheduler-service --omit=dev

COPY --from=build /app/apps/scheduler-service/dist ./apps/scheduler-service/dist

WORKDIR /app/apps/scheduler-service

CMD ["node", "dist/main"]
