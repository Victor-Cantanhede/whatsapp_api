import { Response } from 'express';
import { Injectable } from '@nestjs/common';
import { MessageService } from '../services/message.service';
import { MessageSendDto, MessageSendMediaDto } from '../dtos/MessageSendDto';
import { ResponseModel } from 'src/shared/models/ResponseModel';

@Injectable()
export class MessageUseCase {
	constructor(private readonly messageService: MessageService) { }

	async sendTextMessage(dto: MessageSendDto): Promise<ResponseModel<any>> {
		const response = new ResponseModel<any>();

		try {
			const result = await this.messageService.sendTextMessage(dto);

			response.data = result;
			response.message = 'Mensagem de texto enviada com sucesso!';

		} catch (error) {
			const err = error as any;

			response.message = err.message || 'Ocorreu um erro ao enviar a mensagem de texto!';
			response.success = false;

			console.log(error);
		}

		return response;
	}

	async sendMediaMessage(file: Express.Multer.File, dto: MessageSendMediaDto): Promise<ResponseModel<any>> {
		const response = new ResponseModel<any>();

		try {
			const result = await this.messageService.sendMessageMedia(file, dto);

			response.data = result;
			response.message = 'Mensagem de mídia enviada com sucesso!';

		} catch (error) {
			const err = error as any;

			response.message = err.message || 'Ocorreu um erro ao enviar a mídia!';
			response.success = false;

			console.log(error);
		}

		return response;
	}

	async downloadMedia(connectionId: string, mediaId: string, res: Response): Promise<void> {
		try {
			await this.messageService.downloadMedia(Number(connectionId), mediaId, res);
		} catch (error) {
			const err = error as any;
			console.log(error);

			const status = err.status || 500;

			res.status(status).json({ success: false, message: err.message || 'Ocorreu um erro ao baixar a mídia!' });
		}
	}
}
