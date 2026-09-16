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

		const formattedComponents = dto.components.map((comp) => {
			const type = comp.type.toUpperCase();
			const formatted: Record<string, any> = { type };

			if (comp.format) {
				formatted.format = comp.format.toUpperCase();
			}

			if (comp.text) {
				formatted.text = comp.text;
			}

			if (!comp.example) {
				return formatted;
			}

			if (typeof comp.example === 'object' && !Array.isArray(comp.example)) {
				formatted.example = comp.example;
				return formatted;
			}

			const exampleArray = Array.isArray(comp.example) ? comp.example.map(String) : [String(comp.example)];

			if (type === 'HEADER' && formatted.format === 'DOCUMENT') {
				formatted.example = { header_handle: [exampleArray[0]] };
				return formatted;
			}

			if (type === 'HEADER' && (formatted.format === 'TEXT' || !formatted.format)) {
				formatted.example = { header_text: exampleArray };
				return formatted;
			}

			// Padrão para componente BODY
			formatted.example = {
				body_text: [exampleArray],
			};

			return formatted;
		});

		const payload = {
			name: dto.name,
			language: dto.language || 'pt_BR',
			category: dto.category,
			components: formattedComponents,
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

		const identifier = templateId?.trim();
		if (!identifier) {
			throw new NotFoundException(`Nome ou ID do template não fornecido`);
		}

		const isNumericId = /^\d+$/.test(identifier);

		// Caso seja informado o nome do template (padrão oficial), exclui diretamente na Meta por nome
		if (!isNumericId) {
			const endpoint = `/${connection.waba_id}/message_templates?name=${encodeURIComponent(identifier)}`;
			return this.apiClient.delete(endpoint, connection.user_token);
		}

		// Caso tenha sido fornecido um ID numérico (hsm_id), busca o nome do template antes de deletar
		const templateData = await this.apiClient.get<any>(`/${identifier}`, connection.user_token);

		if (!templateData || !templateData.name) {
			throw new NotFoundException(`Template with ID ${identifier} not found in Meta API`);
		}

		const endpoint = `/${connection.waba_id}/message_templates?hsm_id=${identifier}&name=${templateData.name}`;
		return this.apiClient.delete(endpoint, connection.user_token);
	}
}
