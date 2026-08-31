# 🟢 WhatsApp API Gateway

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

> **Elevator Pitch:** Este projeto atua como uma camada intermediária (middleware/gateway) totalmente desacoplada para facilitar a integração com a **WhatsApp Cloud API oficial da Meta**. Ele abstrai a complexidade do envio e recebimento de mensagens (webhooks), gestão de credenciais seguras e fluxos de autenticação (Embedded Signup). Com esta API, qualquer sistema pode enviar mensagens no WhatsApp informando apenas um ID interno e chamando rotas padronizadas, sem precisar conhecer a fundo as regras burocráticas da Meta.

---

## 📚 Guia de Documentação e Ferramentas DX

Aprender e testar esta API é direto e ágil. Disponibilizamos tanto a documentação técnica oficial quanto interfaces interativas modernas:

1. **Documentação Técnica Oficial:**
   - Para entender regras de negócio, tabelas do banco, webhooks e os detalhes de cada endpoint:
   - 👉 **[Ler API_DOCUMENTATION.md](./.docs/API_DOCUMENTATION.md)**
   - 👉 **[Ler Product Requirements (PRD)](./.docs/PRD.md)**

2. **🚀 Interface Web OpenAPI Dedicada (Playground Next.js):**
   - Console visual rica construída em Next.js para testes completos, gerador de snippets (`cURL`, `JS`, `Axios`, `Python`), simulação de chat WhatsApp, onboarding integrado com Facebook Embedded Signup e documentação de Webhooks.
   - **Como acessar:** `http://localhost:3003` (via Docker ou `npm run dev:web`).
   - 👉 **[Ler Documentação do Frontend Web](./web/README.md)**

3. **📖 Swagger UI OpenAPI:**
   - Especificação interativa OpenAPI v3 com tema Dracula e suporte a Bearer token.
   - **Como acessar:** `http://localhost:5003/api/swagger` *(disponível em `NODE_ENV=development`)*.

4. **🧪 API Tester & Onboarding Legado:**
   - Interface HTML estática e onboarding direto:
   - `http://localhost:5003/api/docs` (Tester HTML standalone)
   - `http://localhost:5003/` (Login SDK Facebook standalone)

---

## 🛠️ Pré-requisitos de Instalação

Antes de começar, certifique-se de que sua máquina possui as seguintes ferramentas:

- **Node.js** (v20+ recomendado, compatível com NestJS 11 e Next.js 15)
- **Gerenciador de pacotes** (npm, pnpm ou yarn)
- **Docker e Docker Compose** (para PostgreSQL, RabbitMQ, FFMPEG-API e opcionalmente o container da interface Web).

---

## ⚙️ Configuração de Ambiente (.env)

O sistema exige a presença de um arquivo `.env` configurado na raiz do projeto. Existe um arquivo modelo `.env.dev` que você pode usar de base:

```bash
cp .env.dev .env
```

Abaixo está o dicionário das variáveis principais:

| Variável | Obrigatório | Padrão (Local) | Descrição |
|----------|-------------|----------------|-----------|
| `NODE_ENV` | Sim | `development` | Define o ambiente (`development` ou `production`). |
| `PORT` | Não | `5003` | Porta de execução da API NestJS. |
| `API_KEY` | Não | - | Chave interna de autorização para consumo das rotas protegidas. |
| `DATABASE_URL` | Sim | *Ver .env.dev* | String de conexão com o PostgreSQL (ex: localhost:5434). |
| `RABBITMQ_URL` | Sim | *Ver .env.dev* | String de conexão com o RabbitMQ (ex: localhost:5675). |
| `CLOUD_API_VERSION` | Sim | `v25.0` | Versão da Cloud API da Meta a ser consultada. |
| `TOKEN_APP_META` | Sim | - | App Secret/Token de acesso raiz do aplicativo na Meta. |
| `META_APP_ID` | Sim | - | ID do Aplicativo registrado no painel da Meta. |
| `META_CONFIGURATION_ID` | Sim | - | ID da Configuração do fluxo Embedded Signup do Facebook. |
| `APP_META_WEBHOOK_VERIFY_TOKEN`| Sim | - | Segredo de validação para configurar o Webhook no painel da Meta. |
| `CLIENT_WEBHOOK_URL` | Sim | - | URL da sua aplicação (client) que receberá o webhook das mensagens. |
| `CLIENT_WEBHOOK_SECRET` | Sim | - | Segredo usado para assinar o webhook e garantir segurança ao cliente. |
| `FFMPEG_API_URL` | Sim | *Ver .env.dev* | URL do microserviço Docker FFMPEG para conversão de áudios. |

---

## 🚀 Rodando o Projeto Localmente

### 1. Inicialize a Infraestrutura (Docker)
Inicie o banco de dados (PostgreSQL), o RabbitMQ, o serviço de áudio (FFMPEG) e opcionalmente a interface Web via Docker Compose:
```bash
docker compose -f docker-compose.dev.yml up -d
```

### 2. Instale as Dependências e Sincronize o Banco
Instale as dependências da API e aplique as migrations no PostgreSQL:
```bash
# Na raiz do projeto:
npm install

# Aplica as migrations criando as tabelas localmente
npx prisma migrate dev
```

### 3. Inicie os Servidores de Desenvolvimento

Você pode iniciar o backend NestJS e o frontend Next.js simultaneamente:

```bash
# Iniciar a API NestJS (Porta 5003):
npm run dev

# Em outro terminal, iniciar a Interface Web Next.js (Porta 3003):
npm run dev:web
```

✅ **Endpoints de Acesso Local:**
- **Interface Web OpenAPI:** [http://localhost:3003](http://localhost:3003)
- **Painel de Webhooks:** [http://localhost:3003/webhooks](http://localhost:3003/webhooks)
- **Swagger UI:** [http://localhost:5003/api/swagger](http://localhost:5003/api/swagger)
- **API Tester Legado:** [http://localhost:5003/api/docs](http://localhost:5003/api/docs)

### 4. Executando os Testes

```bash
# Executar a suíte de testes unitários do Frontend Web (Vitest):
cd web && npm test

# Ou a partir da raiz:
npm --prefix web test
```

---

<p align="center">Desenvolvido com ☕ pela nossa equipe de Engenharia.</p>
