import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as crypto from 'crypto';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly configService: ConfigService,
	) {}

	canActivate(context: ExecutionContext): boolean {
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);

		if (isPublic) {
			return true;
		}

		const request = context.switchToHttp().getRequest<Request>();
		const token = this.extractTokenFromHeader(request);

		if (!token) {
			throw new UnauthorizedException('Token de autorização ausente no header Authorization.');
		}

		const expectedApiKey = this.configService.get<string>('API_KEY');
		if (!expectedApiKey) {
			throw new UnauthorizedException('API_KEY do servidor não está configurada.');
		}

		if (!this.isValidApiKey(token, expectedApiKey)) {
			throw new UnauthorizedException('Token de autorização inválido.');
		}

		return true;
	}

	/**
	 * Extrai o token do header Authorization.
	 * Suporta 'Bearer <token>' ou o token diretamente.
	 */
	private extractTokenFromHeader(request: Request): string | null {
		const authHeader = request.headers['authorization'];

		if (!authHeader || typeof authHeader !== 'string') {
			return null;
		}

		const trimmedHeader = authHeader.trim();

		if (trimmedHeader.startsWith('Bearer ')) {
			return trimmedHeader.slice(7).trim();
		}

		return trimmedHeader;
	}

	/**
	 * Compara os tokens de forma segura contra timing attacks.
	 */
	private isValidApiKey(receivedToken: string, expectedApiKey: string): boolean {
		const receivedBuffer = Buffer.from(receivedToken);
		const expectedBuffer = Buffer.from(expectedApiKey);

		if (receivedBuffer.length !== expectedBuffer.length) {
			return false;
		}

		return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
	}
}
