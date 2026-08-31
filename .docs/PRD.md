# PRD (Product Requirements Document) - WhatsApp API

## 1. Visão Geral do Produto
O **WhatsApp API** é um serviço backend projetado para atuar como uma camada intermediária (middleware/gateway) totalmente desacoplada, facilitando a integração de outras aplicações com a **WhatsApp Cloud API oficial da Meta**. 
A principal motivação é centralizar e abstrair a complexidade da comunicação, envio/recebimento de mensagens (webhooks) e gestão de conexões com o WhatsApp, permitindo que outros serviços consumam essa API de forma simplificada sem precisar lidar com regras específicas da Meta.

## 2. Objetivos
- **Desacoplamento:** Isolar as regras de negócio de mensageria da WhatsApp Cloud API de outras aplicações.
- **Abstração de Credenciais:** Evitar que aplicações clientes precisem persistir dados sensíveis da Meta (como `user_token`, `waba_id`, `phone_id`).
- **Simplicidade de Uso:** Fornecer uma interface enxuta, em que a aplicação cliente apenas utiliza um `connectionId` (identificador interno) e um token de autenticação próprio da API para disparar e receber mensagens.

## 3. Escopo
### 3.1 O que o sistema FAZ
- Recebimento das credenciais geradas pelo fluxo de *Embedded Signup* do Facebook (conforme detalhado na documentação do módulo de conexão).
- Persistência exclusiva de dados de conexão e infraestrutura (`user_token`, `waba_id`, `phone_id` vinculados a um nome de conexão).
- Exposição de endpoints para o envio simplificado de mensagens utilizando a WhatsApp Cloud API.
- Recepção de webhooks da Meta (mensagens recebidas, mudança de status de mensagens) e repasse para as aplicações clientes.
- Gestão de autenticação interna para garantir que apenas serviços autorizados consumam a API.

### 3.2 O que o sistema NÃO FAZ
- Não possui regras de negócio complexas como fluxos de atendimento, chatbots conversacionais, ou gestão de pipelines de vendas.
- Não gerencia contatos, leads ou o histórico completo e persistente de conversas (seu papel é trafegar os dados, a persistência do negócio fica na aplicação cliente).
- Não fornece um painel visual (frontend CRM/inbox) para atendimento e operação diária de mensagens por operadores humanos (embora forneça interfaces completas de Developer Experience, documentação OpenAPI/Swagger e playground interativo para desenvolvedores).

## 4. Arquitetura de Dados
A persistência da aplicação é estritamente focada na conexão. A entidade principal, definida no Prisma, é a `Connections`, responsável por armazenar:
- `id`: Identificador numérico interno (o `connectionId` que será usado pelos clientes).
- `connection_name`: Nome descritivo (ex: "Empresa X").
- `user_token`: Token de acesso da Meta (Access Token).
- `waba_id`: ID da Conta do WhatsApp Business.
- `phone_id`: ID do número de telefone associado à conta para disparo/recebimento.

Além dela, existe a entidade de infraestrutura de entrega `WebhookClientsDev`. A Meta permite configurar apenas **uma** URL de webhook por aplicativo, o que impediria o time de desenvolvimento de receber eventos reais em seus ambientes locais depois que a URL oficial apontar para produção. Para contornar isso, a instância de produção replica cada evento recebido para as URLs cadastradas nessa tabela antes de entregá-lo ao webhook do cliente:
- `url`: URL do tunnel de desenvolvimento (ex.: ngrok, cloudflared).
- `secret`: segredo opcional usado para assinar o payload (HMAC-SHA256); quando nulo, utiliza o `CLIENT_WEBHOOK_SECRET`.

O envio para essas URLs é *best-effort*: falhas são apenas registradas em log e nunca interrompem a entrega ao webhook de produção. Não há endpoints HTTP para gerenciar essa tabela — o cadastro é feito diretamente no banco, de modo a não expor uma superfície pública capaz de redirecionar o tráfego de mensagens.

## 5. Fluxo de Integração
1. **Cadastro de Instância (Embedded Signup):** Uma API/Aplicação cliente inicia o fluxo *Embedded Signup* e autentica com o Facebook. Ao extrair o `token`, `waba_id` e `phone_id`, ela faz um POST para o WhatsApp API para registrar a nova conexão.
2. **Armazenamento Seguro:** A API salva os dados no banco e retorna para a aplicação cliente o identificador gerado (`connectionId`).
3. **Consumo de Mensageria:** Para enviar uma mensagem, o sistema cliente fará uma requisição à API passando:
   - `connectionId` (para referenciar quais credenciais utilizar).
   - Payload da mensagem (telefone de destino, tipo de mensagem, etc.).
   - Token de autorização interno desta API.
4. **Webhooks Inbound:** A Meta envia notificações (mensagens recebidas) para o webhook do WhatsApp API, que por sua vez identifica a conexão associada e propaga o evento para a URL do sistema cliente.

## 6. Considerações Finais
O modelo de negócio da API baseia-se fortemente em atuar de modo similar a outras soluções conhecidas de mercado (como a *Evolution API*), porém focando estritamente em ser um wrapper/proxy da API Oficial da Meta (Cloud API). Isso reduz as dores de integração, assegura estabilidade e garante conformidade com os termos de serviço oficiais do WhatsApp.
