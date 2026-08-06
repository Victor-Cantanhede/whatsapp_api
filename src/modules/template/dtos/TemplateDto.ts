import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class TemplateComponentDto {
	@ApiProperty({ description: 'Tipo do componente, ex: BODY' })
	@IsIn(['BODY'], { message: 'O tipo do componente deve ser obrigatoriamente BODY' })
	type: string;

	@ApiProperty({ description: 'Texto do componente' })
	@IsString()
	@IsNotEmpty()
	text: string;
}

export class CreateTemplateDto {
	@ApiProperty({ description: 'ID da conexão no banco de dados' })
	@IsNumber()
	connectionId: number;

	@ApiProperty({ description: 'Nome do template, ex: teste_02' })
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

	@ApiProperty({ description: 'Categoria do template, ex: MARKETING' })
	@IsIn(['MARKETING', 'UTILITY'], { message: 'A categoria deve ser MARKETING ou UTILITY' })
	category: string;

	@ApiProperty({ type: [TemplateComponentDto], description: 'Componentes do template' })
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => TemplateComponentDto)
	components: TemplateComponentDto[];
}
