# 🌐 WhatsApp API - Web Explorer & OpenAPI Playground

Interface visual interativa desenvolvida com **Next.js 15**, **Tailwind CSS**, **Radix UI** e **Zustand** para testes completos, exploração OpenAPI e onboarding de conexões da **WhatsApp API**.

---

## 🎯 Objetivo

Fornecer uma experiência de desenvolvimento (DX) de alto nível para testar, validar e integrar os endpoints da API sem depender de ferramentas externas como Postman ou Insomnia, incluindo:
- Testes diretos de endpoints com parâmetros dinâmicos e validação JSON/Multipart.
- Onboarding interativo via **Facebook Embedded Signup** (Login com Facebook SDK).
- Gerador de snippets de código em tempo real (`cURL`, `Fetch`, `Axios`, `Python`).
- Prévia de mensagens no formato visual do WhatsApp Web.
- Visualização e cópia de payloads de eventos Webhook (`/webhooks`).
- Histórico local de requisições enviadas.

---

## 🏗️ Arquitetura e Estrutura de Pastas

O projeto frontend segue princípios de **Clean Architecture** e separação de responsabilidades:

```
web/
├── src/
│   ├── app/                                 # Rotas e páginas (Next.js App Router)
│   │   ├── page.tsx                         # OpenAPI Tester Principal
│   │   ├── webhooks/page.tsx                # Painel e Guia de Webhooks
│   │   ├── layout.tsx                       # Root Layout & Theme Provider
│   │   └── globals.css                      # Design Tokens e Estilos Globais
│   ├── application/                         # Estado da aplicação e regras de UI
│   │   ├── hooks/use-code-generator.ts      # Gerador de snippets de código
│   │   └── stores/                          # Stores Zustand (Env, Connections, History)
│   ├── domain/                              # Modelos de domínio e tipagens
│   │   ├── connections/                     # Tipos de Conexões
│   │   ├── messages/                        # Tipos de Mensagens e Mídias
│   │   ├── templates/                       # Tipos de Templates
│   │   └── shared/types.ts                  # Definições de Endpoints e Requisições
│   ├── infrastructure/                      # Clientes HTTP e integrações externas
│   │   ├── api/client.ts                    # Executor de requisições HTTP e sanitização
│   │   ├── api/endpoints.ts                 # Catálogo e esquemas dos endpoints OpenAPI
│   │   └── facebook/fb-sdk.ts               # Integração e SDK do Facebook Login
│   ├── presentation/                        # Componentes visuais
│   │   ├── components/layout/               # Header, Sidebar, EnvBar
│   │   ├── components/tester/               # DynamicForm, JsonEditor, ResponsePanel, etc.
│   │   └── components/whatsapp/             # ChatPreview estilo WhatsApp
│   └── components/ui/                       # Componentes base UI (Radix / Shadcn)
└── src/__tests__/                           # Suíte de testes unitários (Vitest)
```

---

## 🚀 Como Executar

### 1. Diretamente via NPM

Na pasta raiz do repositório ou dentro de `web/`:

```bash
# A partir da raiz do projeto:
npm run dev:web

# Ou dentro da pasta web/:
cd web
npm install
npm run dev
```

Acesse no navegador: **[http://localhost:3003](http://localhost:3003)**.

### 2. Via Docker Compose

A interface Web já está configurada no serviço `web` do `docker-compose.dev.yml`:

```bash
# Na raiz do projeto:
docker compose -f docker-compose.dev.yml up -d web
```

---

## 🧪 Testes Unitários

A aplicação conta com cobertura de testes unitários utilizando **Vitest** e **Testing Library**:

```bash
# Executar todos os testes:
npm test

# Executar testes em modo watch:
npm run test:watch

# Abrir interface gráfica do Vitest:
npm run test:ui
```

### O que é testado:
- `client.spec.ts`: Execução de requisições HTTP, headers `Authorization`, FormData multipart e tratamento empático de erros.
- `endpoints.spec.ts`: Integridade e estrutura das definições dos endpoints OpenAPI.
- `fb-sdk.spec.ts`: Carregamento do script do Facebook SDK e login modal do Embedded Signup.
- `stores.spec.ts`: Persistência e reatividade de variáveis de ambiente (`baseUrl`, `apiKey`, `connectionId`), conexões e histórico.
- `code-generator.spec.ts`: Geração correta de snippets em `cURL`, `JavaScript Fetch`, `Axios` e `Python`.

---

## 🛠️ Tecnologias Utilizadas

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, Standalone Output)
- **Biblioteca UI:** [React 19](https://react.dev/)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Componentes:** [Radix UI](https://www.radix-ui.com/) & [Lucide React Icons](https://lucide.dev/)
- **Gerenciamento de Estado:** [Zustand](https://github.com/pmndrs/zustand)
- **Notificações:** [Sonner](https://sonner.emilkowal.ski/)
- **Testes:** [Vitest](https://vitest.dev/)
