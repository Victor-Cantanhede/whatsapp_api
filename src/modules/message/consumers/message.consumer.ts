import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { ConnectionService } from '../../connection/services/connection.service';
import * as crypto from 'crypto';
import { EventMessageReceivedDto } from '../webhooks/dtos/EventMessageReceivedDto';
import { EventMessageEchoDto } from '../webhooks/dtos/EventMessageEchoDto';
import { WebhookPayloadMessageDto } from '../webhooks/dtos/WebhookPayloadMessageDto';
import { MessageService } from '../services/message.service';
import { convertBufferToBase64 } from '../../../utils/media.utils';
import { WebhookClientDevService } from '../../webhook-client-dev/services/webhook-client-dev.service';

const DEFAULT_DEV_WEBHOOK_TIMEOUT_MS = 5000;
const DEFAULT_CLIENT_WEBHOOK_TIMEOUT_MS = 15000;

@Controller()
export class MessageConsumer {
    constructor(
        private readonly connectionService: ConnectionService,
        private readonly messageService: MessageService,
        private readonly webhookClientDevService: WebhookClientDevService
    ) { }

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

                        const isBase64Enabled = process.env.RETURN_MEDIA_BASE64 === 'true';
                        const mediaType = message.type as string;
                        const mediaData = webhookPayload[mediaType];

                        if (isBase64Enabled && mediaData?.id) {
                            try {
                                const { buffer } = await this.messageService.getMediaBuffer(connection.id, mediaData.id);

                                const base64 = convertBufferToBase64(buffer);
                                if (base64) {
                                    webhookPayload[mediaType].base64 = base64;
                                }
                            } catch (err) {
                                console.error(`[MessageConsumer] Erro ao obter/converter base64 da mídia ${mediaData.id}:`, err.message);
                            }
                        }

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
        // O corpo é serializado uma única vez e reaproveitado: a assinatura HMAC
        // precisa ser calculada exatamente sobre os mesmos bytes que serão enviados.
        const bodyString = JSON.stringify(payload);

        await this.dispatchDevWebhooks(bodyString);

        const isDevEnv = process.env.NODE_ENV === 'development';
        if (isDevEnv) return;

        const url = process.env.CLIENT_WEBHOOK_URL;
        const secret = process.env.CLIENT_WEBHOOK_SECRET;

        if (!url || !secret) {
            throw new Error('CLIENT_WEBHOOK_URL ou CLIENT_WEBHOOK_SECRET não configurados.');
        }

        console.log(`[MessageConsumer] Enviando payload para webhook cliente (${url})...`);

        const timeoutMs = Number(process.env.CLIENT_WEBHOOK_TIMEOUT_MS) || DEFAULT_CLIENT_WEBHOOK_TIMEOUT_MS;
        const status = await this.postWebhook(url, secret, bodyString, timeoutMs);

        console.log(`[MessageConsumer] Webhook cliente respondeu com sucesso: ${status}`);
    }

    /**
     * Replica o payload para as URLs de webhook dos ambientes de desenvolvimento.
     * É best-effort: qualquer falha (URL fora do ar, timeout, banco indisponível) é apenas
     * logada, para nunca impedir a entrega ao webhook de produção.
     */
    private async dispatchDevWebhooks(bodyString: string): Promise<void> {
        try {
            const devClients = await this.webhookClientDevService.getAll();
            if (devClients.length === 0) return;

            const timeoutMs = Number(process.env.DEV_WEBHOOK_TIMEOUT_MS) || DEFAULT_DEV_WEBHOOK_TIMEOUT_MS;

            for (const devClient of devClients) {
                const secret = devClient.secret || process.env.CLIENT_WEBHOOK_SECRET;

                if (!secret) {
                    console.warn(`[MessageConsumer][dev] Nenhum secret configurado para ${devClient.url}. Enviando sem assinatura.`);
                }

                try {
                    console.log(`[MessageConsumer][dev] Enviando payload para webhook de desenvolvimento (${devClient.url})...`);

                    const status = await this.postWebhook(devClient.url, secret, bodyString, timeoutMs);

                    console.log(`[MessageConsumer][dev] Webhook de desenvolvimento respondeu com sucesso: ${status}`);
                } catch (error) {
                    console.error(`[MessageConsumer][dev] Erro ao enviar para ${devClient.url}:`, error.message);
                }
            }
        } catch (error) {
            console.error('[MessageConsumer][dev] Erro ao carregar webhooks de desenvolvimento:', error.message);
        }
    }

    /**
     * Envia o payload já serializado para uma URL, assinando o corpo com HMAC-SHA256.
     * Retorna o status HTTP em caso de sucesso e lança erro caso a resposta não seja ok.
     */
    private async postWebhook(url: string, secret: string | undefined, bodyString: string, timeoutMs: number): Promise<number> {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };

        if (secret) {
            headers['x-webhook-signature'] = crypto.createHmac('sha256', secret).update(bodyString).digest('hex');
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: bodyString,
            signal: AbortSignal.timeout(timeoutMs)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`O webhook cliente retornou status ${response.status}: ${errText}`);
        }

        return response.status;
    }
}
