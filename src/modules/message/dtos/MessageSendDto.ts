import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class MessageSendTextDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	body: string;
}

export class MessageSendDto {
	@ApiProperty({ description: 'ID da conexão no banco de dados' })
	@Type(() => Number)
	@IsNumber()
	connectionId: number;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	to: string;

	@ApiProperty({ default: 'text' })
	@IsOptional()
	@IsString()
	type: string;

	@ApiProperty({ required: false, type: MessageSendTextDto })
	@IsOptional()
	@ValidateNested()
	@Type(() => MessageSendTextDto)
	text?: MessageSendTextDto;

	@ApiProperty({ required: false, description: 'ID da mensagem mencionada' })
	@IsOptional()
	@IsString()
	quotedMessageId?: string;
}

export type MessageType = 'audio' | 'video' | 'image' | 'document' | 'text' | 'sticker' | 'template';

export class MessageSendMediaDto extends MessageSendDto {
	// Herda connectionId, messaging_product, recipient_type, to, type

	// Caso a mídia venha com uma mensagem de texto
	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	caption?: string;
}

export class TemplateDocumentDto {
	@ApiProperty({ required: false, description: 'URL pública do documento (PDF, etc.)', example: 'https://exemplo.com/fatura.pdf' })
	@IsOptional()
	@IsString()
	url?: string;

	@ApiProperty({ required: false, description: 'Conteúdo do documento em Base64 (dispensa storage público/S3)', example: 'JVBERi0xLjQK...' })
	@IsOptional()
	@IsString()
	base64?: string;

	@ApiProperty({ required: false, description: 'ID da mídia já previamente enviada à Meta', example: '1234567890' })
	@IsOptional()
	@IsString()
	id?: string;

	@ApiProperty({ required: false, description: 'Nome do arquivo que será exibido para o contato no WhatsApp', example: 'Fatura_Outubro.pdf' })
	@IsOptional()
	@IsString()
	filename?: string;
}

export class MessageSendTemplateDto {
	@ApiProperty({ description: 'ID da conexão no banco de dados', example: 1 })
	@Type(() => Number)
	@IsNumber()
	connectionId: number;

	@ApiProperty({ description: 'Número do destinatário com DDI (Ex: 5511999999999)', example: '5511999999999' })
	@IsString()
	@IsNotEmpty()
	to: string;

	@ApiProperty({
		required: false,
		description: 'Nome exato do template aprovado na Meta',
		example: 'codigo_verificacao',
	})
	@IsOptional()
	@IsString()
	templateName?: string;

	@ApiProperty({
		required: false,
		description: 'Nome ou ID do template a ser enviado (compatibilidade retroativa)',
		example: 'codigo_verificacao',
	})
	@IsOptional()
	@IsString()
	templateId?: string;

	@ApiProperty({
		required: false,
		description: 'Código do idioma do template',
		default: 'pt_BR',
		example: 'pt_BR',
	})
	@IsOptional()
	@IsString()
	language?: string;

	@ApiProperty({
		required: false,
		type: [String],
		description: 'Valores das variáveis do corpo do template em ordem (ex: {{1}}, {{2}})',
		example: ['João', '123456'],
	})
	@IsOptional()
	@IsArray()
	variables?: (string | number)[];

	@ApiProperty({
		required: false,
		type: TemplateDocumentDto,
		description: 'Documento dinâmico para o cabeçalho do template (suporta url, base64 ou id)',
	})
	@IsOptional()
	@ValidateNested()
	@Type(() => TemplateDocumentDto)
	document?: TemplateDocumentDto;
}

export class MessageSendTemplateMediaDto {
	@ApiProperty({ description: 'ID da conexão no banco de dados', example: 1 })
	@Type(() => Number)
	@IsNumber()
	connectionId: number;

	@ApiProperty({ description: 'Número do destinatário com DDI (Ex: 5511999999999)', example: '5511999999999' })
	@IsString()
	@IsNotEmpty()
	to: string;

	@ApiProperty({ description: 'Nome exato do template aprovado na Meta', example: 'fatura_mensal' })
	@IsString()
	@IsNotEmpty()
	templateName: string;

	@ApiProperty({
		required: false,
		description: 'Código do idioma do template',
		default: 'pt_BR',
		example: 'pt_BR',
	})
	@IsOptional()
	@IsString()
	language?: string;

	@ApiProperty({
		required: false,
		description: 'Nome personalizado do arquivo a ser exibido no WhatsApp (ex: Fatura_Outubro.pdf)',
		example: 'Fatura_Outubro.pdf',
	})
	@IsOptional()
	@IsString()
	filename?: string;

	@ApiProperty({
		required: false,
		description: 'Valores das variáveis do corpo do template em formato array ou JSON string (ex: ["João", "123456"])',
		example: '["João", "123456"]',
	})
	@IsOptional()
	variables?: any;
}

export class MessageSendMediaResponseDto {
	@ApiProperty()
	messaging_product!: string;

	@ApiProperty({
		type: 'array',
		items: {
			type: 'object',
			properties: {
				input: { type: 'string' },
				wa_id: { type: 'string' },
			},
		},
	})
	contacts!: Array<{ input: string; wa_id: string }>;

	@ApiProperty({
		type: 'array',
		items: {
			type: 'object',
			properties: {
				id: { type: 'string' },
			},
		},
	})
	messages!: Array<{ id: string }>;

	@ApiProperty({ required: false })
	base64?: string;
}
