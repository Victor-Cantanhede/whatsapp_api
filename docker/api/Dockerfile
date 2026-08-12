# ---------------------------------------------------------------------------
# WhatsApp API - imagem de produção (NestJS + Prisma)
# Contexto de build esperado: raiz do projeto
# ---------------------------------------------------------------------------

# --- Base comum -------------------------------------------------------------
FROM node:20-alpine AS base

# OpenSSL é requisito dos query engines do Prisma
RUN apk add --no-cache openssl

WORKDIR /app


# --- Dependências completas (dev + prod) para o build -----------------------
FROM base AS deps

COPY package.json package-lock.json ./
RUN npm ci


# --- Build: gera o Prisma Client e compila o TypeScript ---------------------
FROM deps AS build

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY prisma ./prisma
COPY src ./src

RUN npx prisma generate \
    && npm run build


# --- Runtime: somente o necessário para executar ----------------------------
FROM base AS runtime

ENV NODE_ENV=production

# Apenas dependências de produção (o pacote `prisma` está em dependencies,
# então o CLI fica disponível para `prisma migrate deploy`)
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Prisma Client já gerado no estágio de build
COPY --from=build --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma

# Artefatos da aplicação
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node prisma ./prisma

# Página estática servida em GET / e GET /api/docs (AppController usa process.cwd())
COPY --chown=node:node sdk-login-facebook.html api-tester.html ./

USER node

EXPOSE 5003

CMD ["node", "dist/main"]
