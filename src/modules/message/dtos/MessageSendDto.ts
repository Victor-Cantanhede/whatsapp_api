import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class MessageSendTextDto {
	@ApiProperty()
	body: string;
}

export class MessageSendDto {
	@ApiProperty({ description: 'ID da conexão no banco de dados' })
	connectionId: number;

	@ApiProperty()
	to: string;

	@ApiProperty({ default: 'text' })
	type: string;

	@ApiProperty({ required: false, type: MessageSendTextDto })
	text?: MessageSendTextDto;

	@ApiProperty({ required: false, description: 'ID da mensagem mencionada' })
	quotedMessageId?: string;
}

export type MessageType = 'audio' | 'video' | 'image' | 'document' | 'text' | 'sticker' | 'template';

export class MessageSendMediaDto extends MessageSendDto {
	// Herda connectionId, messaging_product, recipient_type, to, type

	// Caso a mídia venha com uma mensagem de texto
	@ApiProperty({ required: false })
	caption?: string;
}

export class MessageSendTemplateDto {
	@ApiProperty({ description: 'ID da conexão no banco de dados', example: 1 })
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
