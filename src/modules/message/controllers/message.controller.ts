import { Body, Controller, Post, Get, Param, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { MessageSendDto, MessageSendMediaDto, MessageSendTemplateDto } from '../dtos/MessageSendDto';
import { MessageUseCase } from '../application/message.use-case';

@Controller('messages')
export class MessageController {
	constructor(private readonly messageUseCase: MessageUseCase) { }

	@Post('text')
	async sendTextMessage(@Body() dto: MessageSendDto) {
		return this.messageUseCase.sendTextMessage(dto);
	}

	@Post('template')
	async sendTemplateMessage(@Body() dto: MessageSendTemplateDto) {
		return this.messageUseCase.sendTemplateMessage(dto);
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

	@Get('media/:connectionId/:mediaId')
	async downloadMedia(
		@Param('connectionId') connectionId: string,
		@Param('mediaId') mediaId: string,
		@Res() res: Response
	) {
		return this.messageUseCase.downloadMedia(connectionId, mediaId, res);
	}

	@Get('media/:connectionId/:mediaId/base64')
	async downloadMediaInBase64(
		@Param('connectionId') connectionId: string,
		@Param('mediaId') mediaId: string
	) {
		return this.messageUseCase.downloadMediaInBase64(connectionId, mediaId);
	}
}
