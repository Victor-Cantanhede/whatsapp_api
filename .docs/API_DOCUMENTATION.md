# 📚 Documentação da API de WhatsApp

Bem-vindo(a) à documentação oficial do **WhatsApp API**!
Esta API funciona como um *middleware/gateway* para facilitar a integração com a **WhatsApp Cloud API oficial da Meta**, abstraindo complexidades de autenticação e regras de negócio da Meta.

---

## 🔒 Autenticação

Para consumir qualquer rota protegida desta API, os clientes consumidores devem enviar a **`API_KEY`** interna configurada no servidor através do cabeçalho HTTP `Authorization`.

**Header Obrigatório:**
```http
Authorization: Bearer <SUA_API_KEY_INTERNA>
```
*(Nota: A API também aceita o envio da chave diretamente sem o prefixo Bearer: `Authorization: <SUA_API_KEY_INTERNA>`).*

### 🛡️ Política de Segurança (Secure by Default)
- **Todas as rotas são protegidas por padrão** por meio de um `ApiKeyGuard` global com comparação segura em tempo constante (`crypto.timingSafeEqual`).
- Caso o cabeçalho esteja ausente ou contenha uma chave inválida, a API retornará imediatamente:
  ```json
  // 401 Unauthorized (Token ausente)
  {
    "statusCode": 401,
    "message": "Token de autorização ausente no header Authorization.",
    "error": "Unauthorized"
  }
  ```
  ```json
  // 401 Unauthorized (Token inválido)
  {
    "statusCode": 401,
    "message": "Token de autorização inválido.",
    "error": "Unauthorized"
  }
  ```

### 🌐 Rotas Públicas (Isentas de API_KEY)
Apenas os seguintes endpoints não exigem a chave interna de autorização:
1. `GET /message/webhook`: Verificação de desafio da Meta (`hub.challenge`).
2. `POST /message/webhook`: Recepção de eventos da Meta (validada criptograficamente via assinatura `x-hub-signature-256`).
3. `GET /connection/facebook-config`: Consulta pública de parâmetros (`appId`, `configId`, `version`) para inicialização da SDK do Facebook no frontend.
4. `GET /` e `GET /api/docs`: Interfaces de onboarding do Facebook e documentação interativa (Swagger / API Tester).

---

## 🔗 1. Módulo de Conexão (`/connection`)
Estes endpoints gerenciam o cadastro de instâncias/números de WhatsApp na API.

### `GET /connection/facebook-config` *(Público)*
- **Descrição Didática:** Retorna as credenciais e parâmetros públicos do aplicativo Meta (`appId`, `configId`, `version`) necessários para inicializar a SDK do Facebook (`FB.init`) no frontend da aplicação durante o fluxo de *Embedded Signup*. Não exige header de autorização.
- **Parâmetros / Body:** Nenhum.
- **Exemplo de Resposta:**
```json
{
  "appId": "1603368927865789",
  "configId": "1640381240764034",
  "version": "v25.0"
}
```

### `POST /connection/oauth-callback`
- **Descrição Didática:** Processa o retorno do fluxo de *Embedded Signup* (Login com Facebook). Recebe o código de autorização do frontend e troca por tokens permanentes, registrando a conexão no banco e devolvendo o `connectionId`. Este é o método preferido em produção.
- **Parâmetros / Body (JSON):**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `code` | string | Sim | Código de autorização retornado pelo Facebook. |
| `waba_id` | string | Sim | ID da Conta do WhatsApp Business (WABA). |
| `connection_name` | string | Não | Nome de identificação interna (padrão: "Nova Conexão..."). |

- **Exemplo de Requisição (fetch):**
```javascript
fetch("https://sua-api.com/connection/oauth-callback", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": "Bearer TOKEN" },
  body: JSON.stringify({
    code: "AQCF-XXXXXX...",
    waba_id: "109XXXXXX",
    connection_name: "Minha Empresa"
  })
});
```

- **Exemplo de Resposta:**
```json
// SUCESSO
{
  "success": true,
  "data": {
    "id": 1,
    "connection_name": "Minha Empresa",
    "waba_id": "109XXXXXX",
    "phone_id": "119XXXXXX"
  }
}
```

### `POST /connection/create`
- **Descrição Didática:** Cria uma conexão manualmente, inserindo credenciais preexistentes. Ideal para testes ou migração de chaves manuais (System Users) já geradas na Meta.
- **Parâmetros / Body (JSON):**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `connection_name` | string | Sim | Nome de identificação (Ex: "Empresa X"). |
| `user_token` | string | Sim | Token de Acesso da Meta. |
| `phone_id` | string | Sim | ID do número de telefone. |
| `waba_id` | string | Sim | ID da conta do WhatsApp. |

- **Exemplo de Requisição (cURL):**
```bash
curl -X POST https://sua-api.com/connection/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "connection_name": "Dev Connection",
    "user_token": "EAAXXX...",
    "phone_id": "1234567890",
    "waba_id": "0987654321"
  }'
```

- **Exemplo de Resposta:**
```json
// SUCESSO
{
  "success": true,
  "data": {
    "id": 2,
    "connection_name": "Dev Connection"
  }
}
```

### `DELETE /connection/:id/disconnect`
- **Descrição Didática:** Efetua a desconexão lógica (Hard Delete) do número na nossa base de dados local. Devido às restrições da Meta para contas modelo SMB (Embedded Signup), a API não possui permissão para forçar o `deregister` remoto. Portanto, o encerramento total do ciclo de vida requer que o usuário também revogue o acesso manualmente pelo painel do Meta Business Suite / WhatsApp Manager.
- **Desconexão Iniciada na Meta:** Caso o usuário revogue ou desconecte a integração diretamente pelo aplicativo do WhatsApp Business ou Meta Business Suite, a Meta emitirá o webhook de `account_update` (`PARTNER_REMOVED`), e a API automaticamente consumirá o evento e removerá o registro da conexão correspondente da base de dados.
- **Parâmetros de Rota (Path):**
  - `:id` (numérico): O `connectionId` da conta a ser desconectada.

- **Exemplo de Requisição (cURL):**
```bash
curl -X DELETE https://sua-api.com/connection/1/disconnect \
  -H "Authorization: Bearer TOKEN"
```

- **Exemplo de Resposta:**
```json
// SUCESSO
{
  "success": true,
  "message": "Conexão desconectada e removida com sucesso.",
  "data": null
}
```

### Endpoints de Consulta de Conexão
Para encontrar IDs e gerenciar contas cadastradas:
- `GET /connection/getAll`: Lista todas.
- `GET /connection/getById?id=1`: Busca por ID numérico (`connectionId`).
- `GET /connection/getByConnectionName?connection_name=EmpresaX`
- `GET /connection/getByPhoneId?phone_id=12345`

*(Nota: Nenhum body é exigido, apenas Query Params e Header de Authorization).*

---

## ✉️ 2. Módulo de Mensagens (`/messages`)
O coração da API. Utilize o `connectionId` obtido anteriormente para disparar mensagens em nome daquele número.

### `POST /messages/text`
- **Descrição Didática:** Envia uma mensagem de texto simples para um número de WhatsApp.
- **Parâmetros / Body (JSON):**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `connectionId` | number | Sim | ID interno da conexão que irá enviar a mensagem. |
| `to` | string | Sim | Número do destinatário no formato internacional (Ex: 5511999999999). |
| `type` | string | Não | Default: "text". |
| `text.body` | string | Sim | O conteúdo da mensagem em si. |
| `quotedMessageId`| string | Não | O ID (WAMID) de uma mensagem caso queira respondê-la. |

- **Exemplo de Requisição (fetch):**
```javascript
fetch("https://sua-api.com/messages/text", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": "Bearer TOKEN" },
  body: JSON.stringify({
    connectionId: 1,
    to: "5511999999999",
    text: {
      body: "Olá, seja bem-vindo ao nosso suporte!"
    }
  })
});
```

- **Exemplo de Resposta:**
```json
// SUCESSO
{
  "messaging_product": "whatsapp",
  "contacts": [{ "input": "5511999999999", "wa_id": "5511999999999" }],
  "messages": [{ "id": "wamid.HBgLNTUxM...==" }]
}
```

### `POST /messages/template`
- **Descrição Didática:** Envia uma mensagem pré-aprovada (Template) pela Meta (geralmente usada para iniciar conversas fora da janela de 24h).
- **Parâmetros / Body (JSON):**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `connectionId` | number | Sim | ID interno da conexão. |
| `to` | string | Sim | Número do destinatário. |
| `templateId` | string | Sim | Nome exato do template aprovado na Meta. |

- **Exemplo de Requisição (cURL):**
```bash
curl -X POST https://sua-api.com/messages/template \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "connectionId": 1,
    "to": "5511999999999",
    "templateId": "hello_world"
  }'
```

### `POST /messages/media`
- **Descrição Didática:** Envia arquivos de mídia (imagem, áudio, documento ou vídeo). Formato Multipart/Form-Data!
- **Parâmetros / Body (Form-Data):**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `file` | binary | Sim | Arquivo físico a ser enviado. |
| `connectionId` | number | Sim | ID interno da conexão. |
| `to` | string | Sim | Número do destinatário. |
| `type` | string | Sim | Tipo de mídia (`audio`, `video`, `image`, `document`). |
| `caption` | string | Não | Texto descritivo para enviar junto com a imagem/vídeo. |

- **Exemplo de Requisição (Javascript / FormData):**
```javascript
const formData = new FormData();
formData.append("file", fileInput.files[0]);
formData.append("connectionId", 1);
formData.append("to", "5511999999999");
formData.append("type", "image");
formData.append("caption", "Veja nossa promoção!");

fetch("https://sua-api.com/messages/media", {
  method: "POST",
  headers: { "Authorization": "Bearer TOKEN" }, // Não setar Content-Type aqui com FormData nativo
  body: formData
});
```

### Endpoints de Download de Mídia
Quando um webhook notifica que você recebeu um áudio ou imagem, o ID dessa mídia virá no payload.
- `GET /messages/media/:connectionId/:mediaId`: Faz stream da mídia bruta.
- `GET /messages/media/:connectionId/:mediaId/base64`: Devolve um JSON com o `base64` do arquivo para facilidade do frontend.

---

## 📑 3. Módulo de Templates (`/templates`)
Gerencia a criação e sincronização de templates na WABA da Meta.

### `POST /templates`
- **Descrição Didática:** Cria um novo template de mensagem e submete para aprovação da Meta.
- **Parâmetros / Body (JSON):**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `connectionId`| number | Sim | ID da conexão vinculada ao WABA que aprovará. |
| `name` | string | Sim | Nome da automação (sem espaços). |
| `category` | string | Sim | Apenas `MARKETING` ou `UTILITY`. |
| `components` | array | Sim | Lista de componentes do template. (Atualmente obriga `type: 'BODY'`). |

- **Exemplo de Requisição (fetch):**
```javascript
fetch("https://sua-api.com/templates", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": "Bearer TOKEN" },
  body: JSON.stringify({
    connectionId: 1,
    name: "aviso_promocao_01",
    category: "MARKETING",
    components: [
      { type: "BODY", text: "Temos uma promoção incrível para você hoje!" }
    ]
  })
});
```

### Consultas de Templates
- `GET /templates/:connectionId`: Lista os templates atrelados à conta especificada.
- `DELETE /templates/:connectionId?templateId=nome_do_template`: Exclui um template da base da Meta.

---

## 🪝 4. Recepção de Webhooks (Eventos da Meta)

Como o WhatsApp é assíncrono, você não recebe as respostas de mensagens no momento do disparo. Em vez disso, a Meta envia requisições HTTP (Webhooks) sempre que algo acontece.

A grande vantagem de usar esta API é que ela atua como um **Proxy de Webhooks**. Ou seja, a API absorve toda a complexidade de validação criptográfica da Meta, formata/filtra os dados e então **repassa o evento limpo** para o servidor da sua aplicação cliente.

### Como a sua aplicação recebe esses eventos?
Em produção, a API estará configurada para disparar um `POST` diretamente para a URL da sua aplicação sempre que um evento de interesse ocorrer.

Os eventos principais que você receberá são:
1. **Mensagem Recebida (`message_received`)**: Quando um cliente te envia um texto, áudio, imagem, etc.
2. **Atualização de Status (`status_updated`)**: Quando uma mensagem que você enviou muda de status (Ex: *sent*, *delivered*, *read*, *failed*).
3. **Conexão Desconectada (`connection_disconnected`)**: Quando uma instância do WhatsApp é revogada/desconectada pelo usuário no Meta Business Suite / WhatsApp Manager.

### Exemplos de Payloads Repassados para Você

#### 1. Mensagem Recebida (`message_received`)
Quando um cliente enviar "Olá!" para o seu número, a sua aplicação receberá um `POST` no webhook cadastrado parecido com isto:

```json
{
  "event": "message_received",
  "connectionId": 1,
  "data": {
    "from": "5511999999999",
    "type": "text",
    "text": {
      "body": "Olá!"
    },
    "timestamp": "1710000000"
  }
}
```

#### 2. Desconexão de Conta (`connection_disconnected`)
Quando o usuário desconectar o número pelo aplicativo da Meta, a sua aplicação receberá:

```json
{
  "event": "connection_disconnected",
  "connectionId": 1,
  "connectionName": "Minha Empresa",
  "phoneNumberId": "119XXXXXX",
  "wabaId": "109XXXXXX",
  "timestamp": 1787711901,
  "reason": "ACCOUNT_DISCONNECTED",
  "initiatedBy": "USER"
}
```
*(Nota: O payload é assinado no header `x-webhook-signature` com HMAC-SHA256 usando o seu `CLIENT_WEBHOOK_SECRET`).*

### Como testar no seu ambiente de Desenvolvimento?
A Meta só permite o cadastro de **uma única URL de Webhook** por App. Para que você consiga receber os eventos na sua máquina local (localhost) sem atrapalhar a produção, esta API possui um recurso de **Multi-Tenancy de Webhooks para Desenvolvimento**.

Para receber os webhooks no seu PC:
1. Crie um túnel reverso para a sua máquina (ex: usando `ngrok` ou `cloudflared`).
2. Acesse o banco de dados desta API e insira a sua URL gerada pelo ngrok na tabela `WebhookClientsDev`.
3. A partir desse momento, a API passará a clonar (fazer um fan-out) todos os eventos recebidos da Meta e também enviá-los para o seu `ngrok` em ambiente local (além de entregar normalmente na URL oficial de produção).

---
**Nota Técnica:** As rotas `GET` e `POST /message/webhook` mapeadas nesta API **não são para o seu uso direto**. Elas são as portas de entrada exclusivas declaradas no portal "Meta for Developers" para que os servidores da Meta consigam entregar os eventos.
