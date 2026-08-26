import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { WebhookClientDevService } from '../../modules/webhook-client-dev/services/webhook-client-dev.service';

const DEFAULT_DEV_WEBHOOK_TIMEOUT_MS = 5000;
const DEFAULT_CLIENT_WEBHOOK_TIMEOUT_MS = 15000;

@Injectable()
export class WebhookDispatcherService {
	constructor(private readonly webhookClientDevService: WebhookClientDevService) {}

	/**
	 * Dispara o payload para os webhooks de desenvolvimento cadastrados e para o webhook cliente oficial em produção.
	 * @param payload Objeto a ser serializado e transmitido
	 * @param contextName Identificador do caller para exibição nos logs (ex: 'MessageConsumer', 'AccountUpdateConsumer')
	 */
	async dispatch<T extends object>(payload: T, contextName: string = 'WebhookDispatcher'): Promise<void> {
		const bodyString = JSON.stringify(payload);

		await this.dispatchDevWebhooks(bodyString, contextName);

		const isDevEnv = process.env.NODE_ENV === 'development';
		if (isDevEnv) return;

		const url = process.env.CLIENT_WEBHOOK_URL;
		const secret = process.env.CLIENT_WEBHOOK_SECRET;

		if (!url || !secret) {
			throw new Error('CLIENT_WEBHOOK_URL ou CLIENT_WEBHOOK_SECRET não configurados.');
		}

		console.log(`[${contextName}] Enviando payload para webhook cliente (${url})...`);

		const timeoutMs = Number(process.env.CLIENT_WEBHOOK_TIMEOUT_MS) || DEFAULT_CLIENT_WEBHOOK_TIMEOUT_MS;
		const status = await this.postWebhook(url, secret, bodyString, timeoutMs);

		console.log(`[${contextName}] Webhook cliente respondeu com sucesso: ${status}`);
	}

	/**
	 * Replica o payload para as URLs de webhook dos ambientes de desenvolvimento.
	 * É best-effort: qualquer falha (URL fora do ar, timeout, erro de banco) é apenas logada.
	 */
	private async dispatchDevWebhooks(bodyString: string, contextName: string): Promise<void> {
		try {
			const devClients = await this.webhookClientDevService.getAll();
			if (!devClients || devClients.length === 0) return;

			const timeoutMs = Number(process.env.DEV_WEBHOOK_TIMEOUT_MS) || DEFAULT_DEV_WEBHOOK_TIMEOUT_MS;

			for (const devClient of devClients) {
				const secret = devClient.secret || process.env.CLIENT_WEBHOOK_SECRET;

				if (!secret) {
					console.warn(`[${contextName}][dev] Nenhum secret configurado para ${devClient.url}. Enviando sem assinatura.`);
				}

				try {
					console.log(`[${contextName}][dev] Enviando payload para webhook de desenvolvimento (${devClient.url})...`);

					const status = await this.postWebhook(devClient.url, secret, bodyString, timeoutMs);

					console.log(`[${contextName}][dev] Webhook de desenvolvimento respondeu com sucesso: ${status}`);
				} catch (error) {
					console.error(`[${contextName}][dev] Erro ao enviar para ${devClient.url}:`, error.message);
				}
			}
		} catch (error) {
			console.error(`[${contextName}][dev] Erro ao carregar webhooks de desenvolvimento:`, error.message);
		}
	}

	/**
	 * Envia o payload serializado para uma URL assinando o corpo com HMAC-SHA256.
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
			signal: AbortSignal.timeout(timeoutMs),
		});

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(`O webhook cliente retornou status ${response.status}: ${errText}`);
		}

		return response.status;
	}
}
