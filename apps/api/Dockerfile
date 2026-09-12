# syntax=docker/dockerfile:1.7

# ---------------------------------------------------------------------------
# Fase 1: build dell'API
# ---------------------------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/core/package.json packages/core/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

RUN npm ci --workspace=@tempra/api --workspace=@tempra/core --include-workspace-root

COPY packages/core packages/core
COPY apps/api apps/api

RUN npm run build --workspace=@tempra/api

# ---------------------------------------------------------------------------
# Fase 2: esecuzione
# Solo le dipendenze di produzione, nessun compilatore, nessun sorgente.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
COPY packages/core/package.json packages/core/
COPY apps/api/package.json apps/api/

RUN npm ci --omit=dev --workspace=@tempra/api --include-workspace-root \
    && npm cache clean --force

COPY --from=build /app/apps/api/dist apps/api/dist
COPY apps/api/drizzle apps/api/drizzle
COPY apps/api/src/db/migrate.ts apps/api/src/db/migrate.ts
COPY docker/api-entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh && chown -R node:node /app

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "apps/api/dist/server.js"]
