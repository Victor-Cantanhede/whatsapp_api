import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { ConnectionService } from '../../connection/services/connection.service';
import * as crypto from 'crypto';
import { EventMessageReceivedDto } from '../webhooks/dtos/EventMessageReceivedDto';
import { EventMessageEchoDto } from '../webhooks/dtos/EventMessageEchoDto';
import { WebhookPayloadMessageDto } from '../webhooks/dtos/WebhookPayloadMessageDto';

@Controller()
export class MessageConsumer {
    constructor(private readonly connectionService: ConnectionService) { }

    @EventPattern('meta_webhook_event')
    async handleMetaWebhookEvent(
        @Payload() data: EventMessageReceivedDto | EventMessageEchoDto,
        @Ctx() context: RmqContext
    ) {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();

        console.log('[MessageConsumer] Mensagem recebida da fila meta_webhook_event:');

        try {
            // A Meta manda webhooks em formato batch, na propriedade "entry"
            if (!data.entry || !Array.isArray(data.entry)) {
                console.log('[MessageConsumer] Evento ignorado (formato inválido da Meta).');
                return channel.ack(originalMsg);
            }

            for (const entry of data.entry) {
                if (!entry.changes || !Array.isArray(entry.changes)) continue;

                // Trata as "changes" com um cast (any[]) pois typescript pode conflitar entre as duas DTOs sem um Type Guard específico
                for (const change of entry.changes as any[]) {
                    if (change.field !== 'messages' && change.field !== 'smb_message_echoes') continue;

                    const isEcho = change.field === 'smb_message_echoes';
                    const messages = isEcho ? change.value?.message_echoes : change.value?.messages;

                    if (!change.value || !messages) continue;

                    const phoneNumberId = change.value.metadata?.phone_number_id;
                    if (!phoneNumberId) continue;

                    // Valida se a conexão existe na nossa base
                    const connection = await this.connectionService.getByPhoneId(phoneNumberId);
                    if (!connection) {
                        console.warn(`[MessageConsumer] Nenhuma conexão encontrada para o phone_number_id: ${phoneNumberId}. Ignorando.`);
                        continue;
                    }

                    const contacts = change.value.contacts || [];

                    for (const message of messages) {
                        const supportedTypes = ['text', 'audio', 'video', 'image', 'document'];
                        if (!supportedTypes.includes(message.type)) {
                            console.log(`[MessageConsumer] Tipo de mensagem não suportado (${message.type}). Ignorando.`);
                            continue;
                        }

                        // Se for echo (fromMe), o wa_id do cliente destino está em message.to
                        // Se for mensagem recebida, o wa_id do remetente está em message.from
                        const waId = isEcho ? message.to : message.from;

                        const contact = contacts.find((c: any) => c.wa_id === waId);
                        const contactName = contact?.profile?.name;

                        const webhookPayload: WebhookPayloadMessageDto = {
                            connectionId: connection.id,
                            phoneNumberId: phoneNumberId,
                            waId: waId,
                            contactName: contactName,
                            providerMessageId: message.id,
                            timestamp: message.timestamp,
                            type: message.type,
                            fromMe: isEcho,
                        };

                        if (message.text?.body) webhookPayload.text = message.text.body;
                        if (message.audio) webhookPayload.audio = message.audio;
                        if (message.video) webhookPayload.video = message.video;
                        if (message.image) webhookPayload.image = message.image;
                        if (message.document) webhookPayload.document = message.document;

                        await this.dispatchWebhook(webhookPayload);
                    }
                }
            }

            channel.ack(originalMsg);
            console.log('[MessageConsumer] Mensagem processada e confirmada (ACK) com sucesso.\n');
        } catch (error) {
            console.error('[MessageConsumer] Erro ao processar mensagem:', error.message);
            channel.nack(originalMsg, false, false);
        }
    }

    private async dispatchWebhook(payload: WebhookPayloadMessageDto): Promise<void> {
        const url = process.env.CLIENT_WEBHOOK_URL;
        const secret = process.env.CLIENT_WEBHOOK_SECRET;

        if (!url || !secret) {
            throw new Error('CLIENT_WEBHOOK_URL ou CLIENT_WEBHOOK_SECRET não configurados.');
        }

        const bodyString = JSON.stringify(payload);
        const signature = crypto.createHmac('sha256', secret).update(bodyString).digest('hex');

        console.log(`[MessageConsumer] Enviando payload para webhook cliente (${url})...`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-webhook-signature': signature
            },
            body: bodyString
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`O webhook cliente retornou status ${response.status}: ${errText}`);
        }

        console.log(`[MessageConsumer] Webhook cliente respondeu com sucesso: ${response.status}`);
    }
}
