import { Body, Controller, ForbiddenException, Get, Post, Query, Headers, Req, type RawBodyRequest, Inject, InternalServerErrorException } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBody } from '@nestjs/swagger';
import * as crypto from 'crypto';
import { Request } from 'express';

@Controller('message/webhook')
export class MessageWebhook {
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
			await lastValueFrom(this.client.emit('meta_webhook_event', data));
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
}
