import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { MessageSendDto, MessageSendMediaDto } from '../dtos/MessageSendDto';
import { MessageUseCase } from '../application/message.use-case';

@Controller('messages')
export class MessageController {
	constructor(private readonly messageUseCase: MessageUseCase) { }

	@Post('text')
	async sendTextMessage(@Body() dto: MessageSendDto) {
		return this.messageUseCase.sendTextMessage(dto);
	}

	@Post('media')
	@UseInterceptors(FileInterceptor('file'))
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				file: {
					type: 'string',
					format: 'binary',
				},
				connectionId: { type: 'number', description: 'ID da conexão no banco de dados' },
				to: { type: 'string', description: 'Número do destinatário' },
				type: { type: 'string', description: 'audio | video | image | document' },
			},
		},
	})
	async sendMediaMessage(
		@UploadedFile() file: Express.Multer.File,
		@Body() dto: MessageSendMediaDto,
	) {
		return this.messageUseCase.sendMediaMessage(file, dto);
	}
}
