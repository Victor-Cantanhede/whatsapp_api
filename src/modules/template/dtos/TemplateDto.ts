import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class TemplateComponentDto {
	@ApiProperty({ description: 'Tipo do componente: BODY, HEADER ou FOOTER', default: 'BODY', enum: ['BODY', 'HEADER', 'FOOTER'] })
	@IsIn(['BODY', 'HEADER', 'FOOTER'], { message: 'O tipo do componente deve ser BODY, HEADER ou FOOTER' })
	type: string;

	@ApiProperty({
		required: false,
		description: 'Formato do cabeçalho quando type for HEADER (ex: DOCUMENT, TEXT, IMAGE, VIDEO)',
		enum: ['DOCUMENT', 'TEXT', 'IMAGE', 'VIDEO'],
		example: 'DOCUMENT',
	})
	@IsOptional()
	@IsIn(['DOCUMENT', 'TEXT', 'IMAGE', 'VIDEO'], { message: 'O formato do cabeçalho deve ser DOCUMENT, TEXT, IMAGE ou VIDEO' })
	format?: string;

	@ApiProperty({
		required: false,
		description: 'Texto do componente contendo placeholders como {{1}}, {{2}} (obrigatório para BODY ou HEADER TEXT)',
		example: 'Olá {{1}}, seu código é {{2}}.',
	})
	@IsOptional()
	@IsString()
	text?: string;

	@ApiProperty({
		required: false,
		description: 'Exemplos de variáveis ou handle de mídia para aprovação da Meta. Ex: ["João", "123"] para BODY, ou ["4::..."] para DOCUMENT header_handle.',
		example: ['João', '123456'],
	})
	@IsOptional()
	example?: string[] | { body_text?: string[][]; header_handle?: string[]; header_text?: string[] };
}

export class CreateTemplateDto {
	@ApiProperty({ description: 'ID da conexão no banco de dados', example: 1 })
	@IsNumber()
	connectionId: number;

	@ApiProperty({ description: 'Nome do template, ex: teste_02', example: 'codigo_verificacao' })
	@IsString()
	@IsNotEmpty()
	@Transform(({ value }) => {
		if (typeof value === 'string') {
			return value
				.toLowerCase()
				.trim()
				.replace(/[^a-z0-9_]+/g, '_')
				.replace(/_+/g, '_')
				.replace(/^_|_$/g, '');
		}
		return value;
	})
	name: string;

	@ApiProperty({ description: 'Categoria do template, ex: MARKETING ou UTILITY', example: 'UTILITY' })
	@IsIn(['MARKETING', 'UTILITY'], { message: 'A categoria deve ser MARKETING ou UTILITY' })
	category: string;

	@ApiProperty({ required: false, description: 'Idioma do template', default: 'pt_BR', example: 'pt_BR' })
	@IsOptional()
	@IsString()
	language?: string;

	@ApiProperty({ type: [TemplateComponentDto], description: 'Componentes do template' })
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => TemplateComponentDto)
	components: TemplateComponentDto[];
}
