import { Injectable } from '@nestjs/common';
import { TemplateService } from '../services/template.service';
import { CreateTemplateDto } from '../dtos/TemplateDto';
import { ResponseModel } from 'src/shared/models/ResponseModel';

@Injectable()
export class TemplateUseCase {
	constructor(private readonly templateService: TemplateService) { }

	async getTemplates(connectionId: number): Promise<ResponseModel<any>> {
		const response = new ResponseModel<any>();

		try {
			const result = await this.templateService.getTemplates(connectionId);

			response.data = result;
			response.message = 'Templates consultados com sucesso!';
		} catch (error) {
			const err = error as any;

			response.message = err.message || 'Ocorreu um erro ao consultar os templates!';
			response.success = false;

			console.error(error);
		}

		return response;
	}

	async createTemplate(dto: CreateTemplateDto): Promise<ResponseModel<any>> {
		const response = new ResponseModel<any>();

		try {
			const result = await this.templateService.createTemplate(dto);

			response.data = result;
			response.message = 'Template criado com sucesso!';
		} catch (error) {
			const err = error as any;

			response.message = err.message || 'Ocorreu um erro ao criar o template!';
			response.success = false;

			console.error(error);
		}

		return response;
	}

	async deleteTemplate(connectionId: number, templateId: string): Promise<ResponseModel<any>> {
		const response = new ResponseModel<any>();

		try {
			const result = await this.templateService.deleteTemplate(connectionId, templateId);

			response.data = result;
			response.message = 'Template deletado com sucesso!';
		} catch (error) {
			const err = error as any;

			response.message = err.message || 'Ocorreu um erro ao deletar o template!';
			response.success = false;

			console.error(error);
		}

		return response;
	}
}
