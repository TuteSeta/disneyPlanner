FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api-gateway/package.json ./apps/api-gateway/

RUN npm ci --workspace=apps/api-gateway

COPY apps/api-gateway ./apps/api-gateway

RUN npm run build --workspace=apps/api-gateway

FROM node:20-alpine AS production
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api-gateway/package.json ./apps/api-gateway/

RUN npm ci --workspace=apps/api-gateway --omit=dev

COPY --from=build /app/apps/api-gateway/dist ./apps/api-gateway/dist

WORKDIR /app/apps/api-gateway

CMD ["node", "dist/main"]
