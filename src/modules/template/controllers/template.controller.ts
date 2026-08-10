import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { TemplateUseCase } from '../application/template.use-case';
import { CreateTemplateDto } from '../dtos/TemplateDto';

@Controller('templates')
export class TemplateController {
	constructor(private readonly templateUseCase: TemplateUseCase) {}

	@Get(':connectionId')
	async getTemplates(@Param('connectionId') connectionId: string) {
		return this.templateUseCase.getTemplates(Number(connectionId));
	}

	@Post()
	async createTemplate(@Body() dto: CreateTemplateDto) {
		return this.templateUseCase.createTemplate(dto);
	}

	@Delete(':connectionId')
	async deleteTemplate(@Param('connectionId') connectionId: string, @Query('templateId') templateId: string) {
		return this.templateUseCase.deleteTemplate(Number(connectionId), templateId);
	}
}
