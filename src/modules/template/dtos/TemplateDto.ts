import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class TemplateComponentDto {
	@ApiProperty({ description: 'Tipo do componente, ex: BODY', default: 'BODY' })
	@IsIn(['BODY'], { message: 'O tipo do componente deve ser obrigatoriamente BODY' })
	type: string;

	@ApiProperty({ description: 'Texto do componente contendo placeholders como {{1}}, {{2}}', example: 'Olá {{1}}, seu código é {{2}}.' })
	@IsString()
	@IsNotEmpty()
	text: string;

	@ApiProperty({
		required: false,
		description: 'Exemplos das variáveis para aprovação da Meta. Pode ser um array de strings ou objeto com body_text.',
		example: ['João', '123456'],
	})
	@IsOptional()
	example?: string[] | { body_text: string[][] };
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
