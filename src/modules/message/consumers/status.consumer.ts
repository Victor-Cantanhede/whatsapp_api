import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { ConnectionService } from '../../connection/services/connection.service';
import { WebhookEvents } from '../webhooks/constants/webhook.constants';
import { EventMessageStatusDto } from '../webhooks/dtos/EventMessageStatusDto';
import { WebhookPayloadStatusDto } from '../webhooks/dtos/WebhookPayloadStatusDto';
import { WebhookDispatcherService } from '../../../shared/services/webhook-dispatcher.service';

@Controller()
export class StatusConsumer {
	constructor(
		private readonly connectionService: ConnectionService,
		private readonly webhookDispatcher: WebhookDispatcherService,
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

						// TODO: Habilitar disparo de webhook para notificações de status quando requerido pelo negócio
						// await this.webhookDispatcher.dispatch(webhookPayload, 'StatusConsumer');
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
}
