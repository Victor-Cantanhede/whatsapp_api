# Plano Simplificado de Correção: Webhook Echo (Meta)

## 1. Causa Raiz Direta
O seu [`MessageConsumer`](file:///c:/Users/victo/dev/whatsapp_api/src/modules/message/consumers/message.consumer.ts) **já está totalmente pronto** para tratar mensagens de Echo:
- Já detecta `isEcho = change.field === 'smb_message_echoes'`.
- Já obtém `messages = change.value?.message_echoes`.
- Já resolve `waId = isEcho ? message.to : message.from`.
- Já define `fromMe = isEcho`.

O único bloqueio está na triagem do [`WebhookController.extrairEventosDoPayload`](file:///c:/Users/victo/dev/whatsapp_api/src/modules/message/webhooks/webhook.controller.ts#L108-L126):
A verificação de `smb_message_echoes` estava aninhada dentro de `if (tipoDoEvento === 'messages')`. Como a Meta manda `change.field` igual a `"smb_message_echoes"`, ela caía no `else if (tipoDoEvento)` e era descartada.

---

## 2. Alterações Necessárias (Mínimas e Cirúrgicas)

### Arquivo 1: [`src/modules/message/webhooks/webhook.controller.ts`](file:///c:/Users/victo/dev/whatsapp_api/src/modules/message/webhooks/webhook.controller.ts)
Ajustar a triagem de eventos:
```typescript
for (const change of changes) {
    const tipoDoEvento = change.field;
    const dados = change.value;

    // Mensagens e status normais
    if (tipoDoEvento === 'messages') {
        if (dados?.statuses) {
            eventosEncontrados.push(WebhookEvents.STATUS_UPDATED);
        }
        if (dados?.messages) {
            eventosEncontrados.push(WebhookEvents.MESSAGE_RECEIVED);
        }
    } 
    // Mensagens enviadas do aparelho físico (Echo)
    else if (tipoDoEvento === 'smb_message_echoes') {
        if (dados?.message_echoes) {
            eventosEncontrados.push(WebhookEvents.MESSAGE_RECEIVED);
        }
    } 
    // Outros eventos
    else if (tipoDoEvento) {
        console.log(`[Webhook] Evento não mapeado na API: ${tipoDoEvento}`);
    }
}
```

### Arquivo 2: [`src/modules/message/webhooks/dtos/EventMessageEchoDto.ts`](file:///c:/Users/victo/dev/whatsapp_api/src/modules/message/webhooks/dtos/EventMessageEchoDto.ts)
Apenas tornar `to_user_id` e `context` opcionais para cobrir o payload real da Meta com precisão:
- `to_user_id?: string;`
- `context?: { from: string; id: string; };`
