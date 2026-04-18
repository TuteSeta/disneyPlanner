FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/trip-service/package.json ./apps/trip-service/

RUN npm ci --workspace=apps/trip-service

COPY apps/trip-service ./apps/trip-service

RUN npm run build --workspace=apps/trip-service

FROM node:20-alpine AS production
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/trip-service/package.json ./apps/trip-service/

RUN npm ci --workspace=apps/trip-service --omit=dev

COPY --from=build /app/apps/trip-service/dist ./apps/trip-service/dist

WORKDIR /app/apps/trip-service

CMD ["node", "dist/main"]
