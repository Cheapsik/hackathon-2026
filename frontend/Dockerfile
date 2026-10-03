# Build context: the repository root (docker-compose.yml), because the API client is generated from
# backend/openapi/Castor.Api.json.
FROM node:22-alpine AS build
WORKDIR /repo/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY backend/openapi/Castor.Api.json /repo/backend/openapi/Castor.Api.json
COPY frontend/ ./
RUN npm run build

FROM nginx:1.30-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/frontend/dist /usr/share/nginx/html
