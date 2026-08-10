import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from 'src/infrastructure/database/prisma/prisma.service';
import { WhatsAppApiClient } from 'src/infrastructure/whatsapp-api/whatsapp-api.client';
import { CreateTemplateDto } from '../dtos/TemplateDto';

@Injectable()
export class TemplateService {
	constructor(
		private readonly db: DbService,
		private readonly apiClient: WhatsAppApiClient,
	) {}

	async getTemplates(connectionId: number) {
		const connection = await this.db.connections.findUnique({
			where: { id: connectionId },
		});

		if (!connection) {
			throw new NotFoundException(`Connection with ID ${connectionId} not found`);
		}

		const endpoint = `/${connection.waba_id}/message_templates`;
		return this.apiClient.get(endpoint, connection.user_token);
	}

	async createTemplate(dto: CreateTemplateDto) {
		const connectionId = Number(dto.connectionId);
		const connection = await this.db.connections.findUnique({
			where: { id: connectionId },
		});

		if (!connection) {
			throw new NotFoundException(`Connection with ID ${connectionId} not found`);
		}

		const payload = {
			name: dto.name,
			language: 'pt_BR',
			category: dto.category,
			components: dto.components,
		};

		return this.apiClient.post(connection.waba_id, connection.user_token, '/message_templates', payload);
	}

	async deleteTemplate(connectionId: number, templateId: string) {
		const connection = await this.db.connections.findUnique({
			where: { id: connectionId },
		});

		if (!connection) {
			throw new NotFoundException(`Connection with ID ${connectionId} not found`);
		}

		// Busca o template diretamente da Meta para recuperar o nome antes de deletar
		const templateData = await this.apiClient.get<any>(`/${templateId}`, connection.user_token);

		if (!templateData || !templateData.name) {
			throw new NotFoundException(`Template with ID ${templateId} not found in Meta API`);
		}

		const endpoint = `/${connection.waba_id}/message_templates?hsm_id=${templateId}&name=${templateData.name}`;
		return this.apiClient.delete(endpoint, connection.user_token);
	}
}
