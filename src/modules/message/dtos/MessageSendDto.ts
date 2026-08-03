import { ApiProperty } from '@nestjs/swagger';

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

export type MessageType = 'audio' | 'video' | 'image' | 'document' | 'text' | 'sticker';

export class MessageSendMediaDto extends MessageSendDto {
	// Herda connectionId, messaging_product, recipient_type, to, type

	// Caso a mídia venha com uma mensagem de texto
	@ApiProperty({ required: false })
	caption?: string;
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
