import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { ConnectionService } from '../services/connection.service';
import { WebhookEvents } from '../../message/webhooks/constants/webhook.constants';
import { EventAccountUpdateDto } from '../../message/webhooks/dtos/EventAccountUpdateDto';
import { WebhookPayloadAccountDisconnectedDto } from '../../message/webhooks/dtos/WebhookPayloadAccountDisconnectedDto';
import { WebhookDispatcherService } from '../../../shared/services/webhook-dispatcher.service';

@Controller()
export class AccountUpdateConsumer {
	constructor(
		private readonly connectionService: ConnectionService,
		private readonly webhookDispatcher: WebhookDispatcherService,
	) {}

	@EventPattern(WebhookEvents.ACCOUNT_UPDATE)
	async handleAccountUpdateEvent(@Payload() data: EventAccountUpdateDto, @Ctx() context: RmqContext) {
		const channel = context.getChannelRef();
		const originalMsg = context.getMessage();

		console.log('[AccountUpdateConsumer] Evento recebido da fila meta_webhook_account_update:');

		try {
			if (!data.entry || !Array.isArray(data.entry)) {
				console.log('[AccountUpdateConsumer] Evento ignorado (formato inválido da Meta).');
				return channel.ack(originalMsg);
			}

			for (const entry of data.entry) {
				if (!entry.changes || !Array.isArray(entry.changes)) continue;

				for (const change of entry.changes) {
					if (change.field !== 'account_update') continue;

					const eventType = change.value?.event;
					const reason = change.value?.disconnection_info?.reason;
					const isDisconnection = eventType === 'PARTNER_REMOVED' || reason === 'ACCOUNT_DISCONNECTED';

					if (!isDisconnection) {
						console.log(
							`[AccountUpdateConsumer] Evento account_update não reconhecido como desconexão (${eventType || 'desconhecido'}). Ignorando.`,
						);
						continue;
					}

					const wabaId = change.value?.waba_info?.waba_id;
					if (!wabaId) {
						console.warn('[AccountUpdateConsumer] Evento de desconexão recebido sem waba_id. Ignorando.');
						continue;
					}

					const connection = await this.connectionService.getByWabaId(wabaId);
					if (!connection) {
						console.warn(
							`[AccountUpdateConsumer] Nenhuma conexão encontrada para o waba_id: ${wabaId}. Registro pode já ter sido removido.`,
						);
						continue;
					}

					const webhookPayload: WebhookPayloadAccountDisconnectedDto = {
						event: 'connection_disconnected',
						connectionId: connection.id,
						connectionName: connection.connection_name,
						phoneNumberId: connection.phone_id,
						wabaId: connection.waba_id,
						timestamp: entry.time || Math.floor(Date.now() / 1000),
						reason: reason || 'ACCOUNT_DISCONNECTED',
						initiatedBy: change.value?.disconnection_info?.initiated_by,
					};

					console.log(
						`[AccountUpdateConsumer] Removendo conexão ID: ${connection.id}, Nome: "${connection.connection_name}", WABA ID: ${wabaId}...`,
					);

					await this.connectionService.delete(connection.id);

					console.log(`[AccountUpdateConsumer] Conexão ID ${connection.id} removida com sucesso do banco de dados.`);

					await this.webhookDispatcher.dispatch(webhookPayload, 'AccountUpdateConsumer');
				}
			}

			channel.ack(originalMsg);

			console.log('[AccountUpdateConsumer] Evento processado e confirmado (ACK) com sucesso.\n');
		} catch (error) {
			console.error('[AccountUpdateConsumer] Erro ao processar evento de conta:', error.message);

			channel.nack(originalMsg, false, false);
		}
	}
}
