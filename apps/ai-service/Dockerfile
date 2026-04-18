FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/ai-service/package.json ./apps/ai-service/

RUN npm ci --workspace=apps/ai-service

COPY apps/ai-service ./apps/ai-service

RUN npm run build --workspace=apps/ai-service

FROM node:20-alpine AS production
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/ai-service/package.json ./apps/ai-service/

RUN npm ci --workspace=apps/ai-service --omit=dev

COPY --from=build /app/apps/ai-service/dist ./apps/ai-service/dist

WORKDIR /app/apps/ai-service

CMD ["node", "dist/main"]
