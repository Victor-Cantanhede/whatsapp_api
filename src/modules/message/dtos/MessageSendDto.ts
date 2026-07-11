import { ApiProperty } from '@nestjs/swagger';

export class MessageSendTextDto {
	@ApiProperty()
	body!: string;
}

export class MessageSendDto {
	@ApiProperty({ description: 'ID da conexão no banco de dados' })
	connectionId!: number;

	@ApiProperty({ default: 'whatsapp' })
	messaging_product: string = 'whatsapp';

	@ApiProperty({ default: 'individual' })
	recipient_type: string = 'individual';

	@ApiProperty()
	to!: string;

	@ApiProperty({ default: 'text' })
	type!: string;

	@ApiProperty({ required: false, type: MessageSendTextDto })
	text?: MessageSendTextDto;
}

export type MessageType = 'audio' | 'video' | 'image' | 'document' | 'text' | 'sticker';

export class MessageSendMediaDto extends MessageSendDto {
	// Herda connectionId, messaging_product, recipient_type, to, type
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
}
