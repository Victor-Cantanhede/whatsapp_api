import { Injectable, CanActivate, ExecutionContext, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DevOnlyGuard implements CanActivate {
	constructor(private configService: ConfigService) {}

	canActivate(context: ExecutionContext): boolean {
		const isDev = this.configService.get<string>('NODE_ENV') === 'development';

		if (!isDev) {
			// Retorna 404 (Not Found) em vez de 403 (Forbidden) para esconder completamente a rota em Produção
			throw new NotFoundException();
		}

		return true;
	}
}
