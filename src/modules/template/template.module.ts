import { Module } from '@nestjs/common';
import { TemplateController } from './controllers/template.controller';
import { TemplateUseCase } from './application/template.use-case';
import { TemplateService } from './services/template.service';

@Module({
	controllers: [TemplateController],
	providers: [TemplateUseCase, TemplateService],
})
export class TemplateModule { }
