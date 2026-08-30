# ---------------------------------------------------------------------------
# WhatsApp API Frontend - Next.js (Standalone)
# Contexto de build esperado: raiz do repositório (.)
# ---------------------------------------------------------------------------

# --- 1. Base Image ---
FROM node:20-alpine AS base
WORKDIR /app

# --- 2. Dependencies ---
FROM base AS deps
COPY web/package.json web/package-lock.json ./
RUN npm ci

# --- 3. Build ---
FROM deps AS builder
COPY web/ ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- 4. Production Runner ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3003
ENV HOSTNAME="0.0.0.0"

# Copia os arquivos gerados pelo build standalone do Next.js
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

USER node

EXPOSE 3003

CMD ["node", "server.js"]
