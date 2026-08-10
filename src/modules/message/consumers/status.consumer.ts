import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { ConnectionService } from '../../connection/services/connection.service';
import * as crypto from 'crypto';
import { WebhookEvents } from '../webhooks/constants/webhook.constants';
import { EventMessageStatusDto } from '../webhooks/dtos/EventMessageStatusDto';
import { WebhookPayloadStatusDto } from '../webhooks/dtos/WebhookPayloadStatusDto';
import { WebhookClientDevService } from '../../webhook-client-dev/services/webhook-client-dev.service';

const DEFAULT_DEV_WEBHOOK_TIMEOUT_MS = 5000;
const DEFAULT_CLIENT_WEBHOOK_TIMEOUT_MS = 15000;

@Controller()
export class StatusConsumer {
	constructor(
		private readonly connectionService: ConnectionService,
		private readonly webhookClientDevService: WebhookClientDevService,
	) {}

	@EventPattern(WebhookEvents.STATUS_UPDATED)
	async handleMetaWebhookStatus(@Payload() data: EventMessageStatusDto, @Ctx() context: RmqContext) {
		const channel = context.getChannelRef();
		const originalMsg = context.getMessage();

		console.log('[StatusConsumer] Evento de status recebido da fila meta_webhook_status:');

		try {
			if (!data.entry || !Array.isArray(data.entry)) {
				console.log('[StatusConsumer] Evento ignorado (formato inválido da Meta).');
				return channel.ack(originalMsg);
			}

			for (const entry of data.entry) {
				if (!entry.changes || !Array.isArray(entry.changes)) continue;

				for (const change of entry.changes) {
					if (change.field !== 'messages') continue;

					const statuses = change.value?.statuses;
					if (!statuses) continue;

					const phoneNumberId = change.value.metadata?.phone_number_id;
					if (!phoneNumberId) continue;

					const connection = await this.connectionService.getByPhoneId(phoneNumberId);
					if (!connection) {
						console.warn(`[StatusConsumer] Nenhuma conexão encontrada para o phone_number_id: ${phoneNumberId}. Ignorando.`);
						continue;
					}

					for (const status of statuses) {
						const webhookPayload: WebhookPayloadStatusDto = {
							connectionId: connection.id,
							phoneNumberId: phoneNumberId,
							waId: status.recipient_id,
							providerMessageId: status.id,
							timestamp: status.timestamp,
							status: status.status,
						};

						if (status.errors && status.errors.length > 0) {
							webhookPayload.errors = status.errors.map((err) => ({
								code: err.code,
								title: err.title,
								message: err.message,
								error_data: err.error_data,
							}));
						}

						// TODO: Melhorar forma de disparo de webhook para notificações de staus de mensagens
						// await this.dispatchWebhook(webhookPayload);
					}
				}
			}

			channel.ack(originalMsg);
			console.log('[StatusConsumer] Evento processado e confirmado (ACK) com sucesso.\n');
		} catch (error) {
			console.error('[StatusConsumer] Erro ao processar evento de status:', error.message);
			channel.nack(originalMsg, false, false);
		}
	}

	private async dispatchWebhook(payload: WebhookPayloadStatusDto): Promise<void> {
		const bodyString = JSON.stringify(payload);

		await this.dispatchDevWebhooks(bodyString);

		const isDevEnv = process.env.NODE_ENV === 'development';
		if (isDevEnv) return;

		const url = process.env.CLIENT_WEBHOOK_URL;
		const secret = process.env.CLIENT_WEBHOOK_SECRET;

		if (!url || !secret) {
			throw new Error('CLIENT_WEBHOOK_URL ou CLIENT_WEBHOOK_SECRET não configurados.');
		}

		console.log(`[StatusConsumer] Enviando payload para webhook cliente (${url})...`);

		const timeoutMs = Number(process.env.CLIENT_WEBHOOK_TIMEOUT_MS) || DEFAULT_CLIENT_WEBHOOK_TIMEOUT_MS;
		const status = await this.postWebhook(url, secret, bodyString, timeoutMs);

		console.log(`[StatusConsumer] Webhook cliente respondeu com sucesso: ${status}`);
	}

	private async dispatchDevWebhooks(bodyString: string): Promise<void> {
		try {
			const devClients = await this.webhookClientDevService.getAll();
			if (devClients.length === 0) return;

			const timeoutMs = Number(process.env.DEV_WEBHOOK_TIMEOUT_MS) || DEFAULT_DEV_WEBHOOK_TIMEOUT_MS;

			for (const devClient of devClients) {
				const secret = devClient.secret || process.env.CLIENT_WEBHOOK_SECRET;

				if (!secret) {
					console.warn(`[StatusConsumer][dev] Nenhum secret configurado para ${devClient.url}. Enviando sem assinatura.`);
				}

				try {
					console.log(`[StatusConsumer][dev] Enviando payload para webhook de desenvolvimento (${devClient.url})...`);

					const status = await this.postWebhook(devClient.url, secret, bodyString, timeoutMs);

					console.log(`[StatusConsumer][dev] Webhook de desenvolvimento respondeu com sucesso: ${status}`);
				} catch (error) {
					console.error(`[StatusConsumer][dev] Erro ao enviar para ${devClient.url}:`, error.message);
				}
			}
		} catch (error) {
			console.error('[StatusConsumer][dev] Erro ao carregar webhooks de desenvolvimento:', error.message);
		}
	}

	private async postWebhook(url: string, secret: string | undefined, bodyString: string, timeoutMs: number): Promise<number> {
		const headers: Record<string, string> = { 'Content-Type': 'application/json' };

		if (secret) {
			headers['x-webhook-signature'] = crypto.createHmac('sha256', secret).update(bodyString).digest('hex');
		}

		const response = await fetch(url, {
			method: 'POST',
			headers,
			body: bodyString,
			signal: AbortSignal.timeout(timeoutMs),
		});

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(`O webhook cliente retornou status ${response.status}: ${errText}`);
		}

		return response.status;
	}
}
