import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from 'src/infrastructure/database/prisma/prisma.service';
import { MessageSendDto, MessageSendMediaDto, MessageSendMediaResponseDto, MessageType } from '../dtos/MessageSendDto';
import { WhatsAppApiClient } from 'src/infrastructure/whatsapp-api/whatsapp-api.client';
import { BadRequestException, BadGatewayException } from '@nestjs/common';

@Injectable()
export class MessageService {
	constructor(
		private readonly db: DbService,
		private readonly apiClient: WhatsAppApiClient,
	) { }

	async sendTextMessage(dto: MessageSendDto) {
		const connectionId = Number(dto.connectionId);
		const connection = await this.db.connections.findUnique({
			where: { id: connectionId },
		});

		if (!connection) {
			throw new NotFoundException(`Connection with ID ${connectionId} not found`);
		}

		if (!dto.text?.body) {
			throw new BadRequestException('Text body is required for text messages');
		}

		const payload: Omit<MessageSendDto, 'connectionId'> = {
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: dto.to,
			type: 'text',
			text: {
				body: dto.text.body,
			},
		};

		return this.apiClient.post(connection.phone_id, connection.user_token, '/messages', payload);
	}

	async sendMessageMedia(
		file: Express.Multer.File,
		dto: MessageSendMediaDto,
	): Promise<MessageSendMediaResponseDto> {
		const connectionId = Number(dto.connectionId);
		const connection = await this.db.connections.findUnique({
			where: { id: connectionId },
		});

		if (!connection) {
			throw new NotFoundException(`Connection with ID ${connectionId} not found`);
		}

		const phoneId = connection.phone_id;
		const userToken = connection.user_token;

		// Valida se o tipo de arquivo enviado condiz com o tipo solicitado no payload
		const allowedFileTypes: MessageType[] = ['audio', 'video', 'image', 'document'];
		const uploadedFileType = file.mimetype.split('/')[0];

		const isMediaTypeValid =
			uploadedFileType === dto.type || (!allowedFileTypes.includes(uploadedFileType as MessageType) && dto.type === 'document');

		if (!isMediaTypeValid) {
			throw new BadRequestException('O tipo de arquivo enviado não condiz com o tipo de arquivo inserido no payload!');
		}

		let fileBuffer = file.buffer;
		let fileMimeType = file.mimetype;
		let fileName = file.originalname;

		// Caso o arquivo seja um audio com formato diferente de "ogg", chama o serviço de conversão de audio para o formato ogg (requerido pela meta)
		// if (uploadedFileType === 'audio' && fileMimeType !== 'audio/ogg') {
		// 	const convertedAudio = await convertAudioToOgg({
		// 		buffer: fileBuffer,
		// 		mimetype: fileMimeType,
		// 		filename: fileName,
		// 	}).catch(() => {
		// 		throw new BadGatewayException('Ocorreu um erro interno na tratativa do formato de audio, entre em contato com o suporte!');
		// 	});

		// 	fileBuffer = convertedAudio.buffer;
		// 	fileMimeType = convertedAudio.mimetype;
		// 	fileName = convertedAudio.filename;
		// }

		// Configura o arquivo de mídia para enviar no form-data da requisição
		const formData = new FormData();

		// FormData nativo no Node aceita Blob para arquivos (usamos 'as any' para ignorar o erro restrito de tipagem do TS)
		const blob = new Blob([fileBuffer as any], { type: fileMimeType });

		formData.append('file', blob, fileName);
		formData.append('messaging_product', 'whatsapp');

		// Faz o upload da mídia para o whatsapp para recuperar o mediaId da mensagem
		const uploadedMedia = await this.apiClient
			.post<{ id: string }>(phoneId, userToken, '/media', formData)
			.catch((err) => {
				console.error('Error uploading media:', err);
				throw new BadGatewayException('Ocorreu um erro ao enviar o arquivo para o Whatsapp!');
			});

		// Agora envia a mensagem para o destinatário usando o mediaId
		const payload = {
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: dto.to,
			type: dto.type,
			[dto.type]: {
				id: uploadedMedia.id,
			},
		};

		return this.apiClient.post<MessageSendMediaResponseDto>(phoneId, userToken, '/messages', payload);
	}
}
