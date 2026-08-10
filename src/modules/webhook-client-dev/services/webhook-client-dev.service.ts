import { Injectable } from '@nestjs/common';
import { DbService } from 'src/infrastructure/database/prisma/prisma.service';
import { WebhookClientDevEntity } from '../entity/WebhookClientDevEntity';

@Injectable()
export class WebhookClientDevService {
	constructor(private readonly db: DbService) {}

	/**
	 * Retorna a entidade crua (e não um ResponseDto) porque o consumer precisa do `secret`,
	 * que é usado apenas internamente para assinar o payload e nunca sai da aplicação.
	 */
	async getAll(): Promise<WebhookClientDevEntity[]> {
		return this.db.webhookClientsDev.findMany();
	}
}
