import { Body, Controller, ForbiddenException, Get, Post, Query, Headers, Req, type RawBodyRequest, Inject, InternalServerErrorException } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBody } from '@nestjs/swagger';
import * as crypto from 'crypto';
import { Request } from 'express';
import { WebhookEvents } from './constants/webhook.constants';

@Controller('message/webhook')
export class WebhookController {
	private readonly wpp_verify_token = process.env.APP_META_WEBHOOK_VERIFY_TOKEN;
	private readonly wpp_app_secret = process.env.TOKEN_APP_META;

	constructor(
		@Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy
	) { }

	// Método utilizado para a meta verificar se o webhook está disponível para receber requisições
	// A meta obriga o sistema disponibilizar um GET antes de enviar requisições para o POST
	@Get()
	async verifyWebhook(
		@Query('hub.mode') mode: string,
		@Query('hub.challenge') challenge: string,
		@Query('hub.verify_token') token: string
	) {
		const validated = mode === 'subscribe' && token === this.wpp_verify_token;
		if (!validated) {
			throw new ForbiddenException();
		}

		console.log('WEBHOOK VERIFIED!');
		return challenge;
	}

	@Post()
	@ApiBody({ schema: { type: 'object' } })
	async handleMessage(
		@Body() data: any,
		@Headers('x-hub-signature-256') signature: string,
		@Req() req: RawBodyRequest<Request>,
	) {
		this.validateSignature(signature, req.rawBody);
		console.log('WEBHOOK SIGNATURE VERIFIED!');

		try {
			// 1. Descobrimos quais eventos a Meta enviou neste pacote (webhook)
			const eventosParaProcessar = this.extrairEventosDoPayload(data);

			// 2. Disparamos um evento no RabbitMQ para cada evento encontrado
			for (const evento of eventosParaProcessar) {
				await lastValueFrom(this.client.emit(evento, data));
			}

			return { success: true };
		} catch (error) {
			console.error('Erro ao publicar no RabbitMQ:', error.message);
			throw new InternalServerErrorException('Broker unavailable');
		}
	}

	/*
	 * Valida a integridade da requisição usando o x-hub-signature-256
	 * Garante que a requisição veio da Meta e não sofreu alterações
	 */
	private validateSignature(signature: string, rawBody: Buffer | undefined): void {
		if (process.env.NODE_ENV === 'development') {
			console.log('[DEV MODE] Ignorando validação de assinatura do webhook');
			return;
		}

		if (!this.wpp_app_secret) {
			console.warn('App secret is not defined in the environment variables (TOKEN_APP_META)');
			throw new ForbiddenException('Server configuration error');
		}

		if (!signature || !rawBody) {
			console.warn('Missing signature or raw body');
			throw new ForbiddenException('Invalid request format');
		}

		const expectedSignature = 'sha256=' + crypto
			.createHmac('sha256', this.wpp_app_secret)
			.update(rawBody)
			.digest('hex');

		if (signature !== expectedSignature) {
			console.warn('Invalid signature mismatch');
			throw new ForbiddenException('Invalid signature');
		}
	}

	/**
	 * Função auxiliar para extrair todos os tipos de eventos presentes no payload da Meta.
	 * É útil porque a Meta pode enviar vários eventos agrupados em uma única requisição.
	 */
	private extrairEventosDoPayload(data: any): string[] {
		const eventosEncontrados: string[] = [];

		// Verifica se existe o array "entry", que é o padrão estrutural da Meta
		const entries = data?.entry || [];

		for (const entry of entries) {
			const changes = entry.changes || [];

			for (const change of changes) {
				const tipoDoEvento = change.field;

				// O campo "messages" é especial, pois ele agrupa tanto mensagens quanto atualizações de status
				if (tipoDoEvento === 'messages') {
					const dados = change.value;

					// Se tiver a chave "statuses", sabemos que é uma notificação de status (ex: failed, delivered)
					if (dados?.statuses) {
						eventosEncontrados.push(WebhookEvents.STATUS_UPDATED);
					}

					// Se tiver "messages" ou "smb_message_echoes", sabemos que é uma mensagem normal chegando
					if (dados?.messages || dados?.smb_message_echoes) {
						eventosEncontrados.push(WebhookEvents.MESSAGE_RECEIVED);
					}
				}

				// Para todos os outros eventos (ex: 'security', 'account_alerts') que a Meta possa inventar
				else if (tipoDoEvento) {
					console.log(`[Webhook] Evento não mapeado na API: ${tipoDoEvento}`);
				}
			}
		}

		// Se o payload não combinar com nada conhecido, classificamos como vazio
		if (eventosEncontrados.length === 0) {
			return [];
		}

		// Removemos eventos repetidos para não disparar pro RabbitMQ duas vezes à toa
		// Ex: Se chegar dois status, basta retornar ['meta_webhook_status']
		return [...new Set(eventosEncontrados)];
	}
}
