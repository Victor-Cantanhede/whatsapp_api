import { Response } from 'express';
import { Injectable } from '@nestjs/common';
import { MessageService } from '../services/message.service';
import { MessageSendDto, MessageSendMediaDto, MessageSendTemplateDto, MessageSendTemplateMediaDto } from '../dtos/MessageSendDto';
import { ResponseModel } from 'src/shared/models/ResponseModel';

@Injectable()
export class MessageUseCase {
	constructor(private readonly messageService: MessageService) {}

	private extractErrorMessage(error: any, fallback: string): string {
		if (!error) return fallback;

		const responseData = error.response || (typeof error.getResponse === 'function' ? error.getResponse() : null);

		if (responseData) {
			if (typeof responseData === 'string') {
				return responseData;
			}

			const metaError = responseData.error || responseData;
			const details: string | undefined = metaError.error_data?.details;
			const metaMsg: string | undefined = metaError.message;

			if (details) {
				if (details.includes('Template does not contain title component')) {
					return `O template selecionado não possui componente de cabeçalho (HEADER) cadastrado na Meta. Para enviar arquivos em templates, crie um template na Meta com cabeçalho do tipo DOCUMENT. (Detalhe da Meta: ${details})`;
				}
				if (metaMsg) {
					return `${metaMsg} — ${details}`;
				}
				return details;
			}

			if (metaMsg) {
				return metaMsg;
			}

			if (responseData.message && responseData.message !== 'Http Exception') {
				return Array.isArray(responseData.message) ? responseData.message.join(', ') : responseData.message;
			}
		}

		if (error.message && error.message !== 'Http Exception') {
			return error.message;
		}

		return fallback;
	}

	async sendTextMessage(dto: MessageSendDto): Promise<ResponseModel<any>> {
		const response = new ResponseModel<any>();

		try {
			const result = await this.messageService.sendTextMessage(dto);

			response.data = result;
			response.message = 'Mensagem de texto enviada com sucesso!';
		} catch (error) {
			response.message = this.extractErrorMessage(error, 'Ocorreu um erro ao enviar a mensagem de texto!');
			response.success = false;

			console.error('sendTextMessage error:', error);
		}

		return response;
	}

	async sendTemplateMessage(dto: MessageSendTemplateDto): Promise<ResponseModel<any>> {
		const response = new ResponseModel<any>();

		try {
			const result = await this.messageService.sendTemplateMessage(dto);

			response.data = result;
			response.message = 'Mensagem de template enviada com sucesso!';
		} catch (error) {
			response.message = this.extractErrorMessage(error, 'Ocorreu um erro ao enviar a mensagem de template!');
			response.success = false;

			console.error('sendTemplateMessage error:', error);
		}

		return response;
	}

	async sendTemplateMediaMessage(file: Express.Multer.File, dto: MessageSendTemplateMediaDto): Promise<ResponseModel<any>> {
		const response = new ResponseModel<any>();

		try {
			const result = await this.messageService.sendTemplateMediaMessage(file, dto);

			response.data = result;
			response.message = 'Mensagem de template com documento enviada com sucesso!';
		} catch (error) {
			response.message = this.extractErrorMessage(error, 'Ocorreu um erro ao enviar o template com documento!');
			response.success = false;

			console.error('sendTemplateMediaMessage error:', error);
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
			response.message = this.extractErrorMessage(error, 'Ocorreu um erro ao enviar a mídia!');
			response.success = false;

			console.error('sendMediaMessage error:', error);
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

	async downloadMediaInBase64(connectionId: string, mediaId: string): Promise<ResponseModel<{ base64: string; mimeType: string }>> {
		const response = new ResponseModel<{ base64: string; mimeType: string }>();

		try {
			const data = await this.messageService.downloadMediaInBase64(Number(connectionId), mediaId);

			response.data = data;
			response.message = 'Mídia em base64 baixada com sucesso!';
		} catch (error) {
			const err = error as any;

			response.message = err.message || 'Ocorreu um erro ao baixar a mídia em base64!';
			response.success = false;

			console.log(error);
		}

		return response;
	}
}
