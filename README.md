# 🟢 WhatsApp API Gateway

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

> **Elevator Pitch:** Este projeto atua como uma camada intermediária (middleware/gateway) totalmente desacoplada para facilitar a integração com a **WhatsApp Cloud API oficial da Meta**. Ele abstrai a complexidade do envio e recebimento de mensagens (webhooks), gestão de credenciais seguras e fluxos de autenticação (Embedded Signup). Com esta API, qualquer sistema pode enviar mensagens no WhatsApp informando apenas um ID interno e chamando rotas padronizadas, sem precisar conhecer a fundo as regras burocráticas da Meta.

---

## 📚 Guia de Documentação (Onde Encontrar as Regras)

Aprender a consumir esta API é um processo simples. Preparamos uma documentação técnica e um ambiente interativo prático para você.

1. **Documentação Técnica Oficial:**
   - Para entender o negócio, a arquitetura, as tabelas do banco e o fluxo exato de cada endpoint, leia sempre a documentação estática gerada na pasta `.docs/`:
   - 👉 **[Ler API_DOCUMENTATION.md](./.docs/API_DOCUMENTATION.md)**
   - 👉 **[Ler Product Requirements (PRD)](./.docs/PRD.md)**

2. **Testador Interativo (Playground DX):**
   - Nossa API possui uma interface de testes ("API Tester") inspirada no WhatsApp Web, feita especialmente para você entender o funcionamento na prática sem precisar configurar o Postman.
   - **Como acessar:** Basta subir a aplicação (veja os passos abaixo) e acessar no seu navegador: `http://localhost:5003/api/docs`
   - *(Atenção: essa rota interativa só fica disponível quando `NODE_ENV=development`)*.

---

## 🛠️ Pré-requisitos de Instalação

Antes de começar, certifique-se de que sua máquina possui as seguintes ferramentas:

- **Node.js** (v20+ recomendado, compatível com a stack do NestJS 11)
- **Gerenciador de pacotes** (npm, ou opcionalmente yarn/pnpm)
- **Docker e Docker Compose** (necessários para subir os serviços locais do Banco de Dados PostgreSQL, RabbitMQ e FFMPEG-API).

---

## ⚙️ Configuração de Ambiente (.env)

O sistema exige a presença de um arquivo `.env` configurado. Existe um arquivo modelo `.env.dev` que você pode usar de base para começar no ambiente local.

Copie o modelo usando o comando:
```bash
cp .env.dev .env
```

Abaixo está o dicionário das variáveis principais:

| Variável | Obrigatório | Padrão (Local) | Descrição |
|----------|-------------|----------------|-----------|
| `NODE_ENV` | Sim | `development` | Define o ambiente (`development` ou `production`). |
| `PORT` | Não | `5003` | Porta de execução da API Nest. |
| `DATABASE_URL` | Sim | *Ver .env.dev* | String de conexão com o PostgreSQL (ex: localhost:5434). |
| `RABBITMQ_URL` | Sim | *Ver .env.dev* | String de conexão com o RabbitMQ (ex: localhost:5673). |
| `CLOUD_API_VERSION` | Sim | `v25.0` | Versão da Cloud API da Meta a ser consultada. |
| `TOKEN_APP_META` | Sim | - | App Secret/Token de acesso raiz do aplicativo na Meta. |
| `META_APP_ID` | Sim | - | ID do Aplicativo registrado no painel da Meta. |
| `META_CONFIGURATION_ID` | Sim | - | ID da Configuração do fluxo Embedded Signup do Facebook. |
| `APP_META_WEBHOOK_VERIFY_TOKEN`| Sim | - | Segredo de validação para configurar o Webhook lá no painel da Meta. |
| `CLIENT_WEBHOOK_URL` | Sim | - | URL da sua aplicação (client) que receberá o webhook das mensagens. |
| `CLIENT_WEBHOOK_SECRET` | Sim | - | Segredo usado para assinar o webhook e garantir segurança ao cliente. |
| `FFMPEG_API_URL` | Sim | *Ver .env.dev* | URL do microserviço Docker FFMPEG para conversão de aúdios. |

---

## 🚀 Rodando o Projeto Localmente

Siga o passo a passo de "copiar e colar" para colocar a API de pé em menos de 5 minutos:

### 1. Inicialize a Infraestrutura (Docker)
Antes de ligar a aplicação Node, precisamos que o banco de dados (PostgreSQL), o sistema de filas (RabbitMQ) e a API de conversão de mídia (FFMPEG) estejam rodando:
```bash
# Subindo os containers do ambiente de desenvolvimento em segundo plano
docker-compose -f docker-compose.dev.yml up -d
```

### 2. Instale as Dependências e Sincronize o Banco
Baixe os pacotes NPM e aplique a estrutura de tabelas no banco de dados via Prisma:
```bash
npm install

# Aplica as migrations criando as tabelas localmente
npx prisma migrate dev
```

### 3. Inicie o Servidor de Desenvolvimento
Inicie a aplicação NestJS em modo `watch` (hot-reload):
```bash
npm run dev
```

✅ O servidor iniciará. Você deverá ver logs do Nest indicando "Nest application successfully started".
Você pode acessar a interface de testes local no navegador através da rota:  
🔗 **[http://localhost:5003/api/docs](http://localhost:5003/api/docs)**

### 4. Rodando os Testes (Opcional)
Se precisar garantir a integridade dos módulos através do Jest:
```bash
npm run test
```

---

<p align="center">Desenvolvido com ☕ pela nossa equipe de Engenharia.</p>
