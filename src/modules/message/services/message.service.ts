import { Response } from 'express';
import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from 'src/infrastructure/database/prisma/prisma.service';
import { MessageSendDto, MessageSendMediaDto, MessageSendMediaResponseDto, MessageType, MessageSendTemplateDto, MessageSendTemplateMediaDto, TemplateDocumentDto } from '../dtos/MessageSendDto';
import { WhatsAppApiClient } from 'src/infrastructure/whatsapp-api/whatsapp-api.client';
import { BadRequestException, BadGatewayException } from '@nestjs/common';
import { convertBufferToBase64 } from 'src/utils/media.utils';

@Injectable()
export class MessageService {
	constructor(
		private readonly db: DbService,
		private readonly apiClient: WhatsAppApiClient,
	) {}

	private parseVariables(variables?: any): (string | number)[] {
		if (!variables) return [];
		if (Array.isArray(variables)) return variables;
		if (typeof variables === 'string') {
			try {
				const parsed = JSON.parse(variables);
				if (Array.isArray(parsed)) return parsed;
			} catch {
				return [variables];
			}
		}
		return [String(variables)];
	}

	private async uploadBufferToMeta(phoneId: string, userToken: string, fileBuffer: Buffer, fileName: string, mimeType = 'application/pdf'): Promise<string> {
		const formData = new FormData();
		const blob = new Blob([fileBuffer as any], { type: mimeType });
		formData.append('file', blob, fileName);
		formData.append('messaging_product', 'whatsapp');

		const uploadedMedia = await this.apiClient.post<{ id: string }>(phoneId, userToken, '/media', formData).catch((err) => {
			console.error('Error uploading template media to Meta:', err);
			throw new BadGatewayException('Ocorreu um erro ao enviar o arquivo de template para o WhatsApp!');
		});

		return uploadedMedia.id;
	}

	private async resolveDocumentHeaderComponent(phoneId: string, userToken: string, doc?: TemplateDocumentDto): Promise<Record<string, any> | null> {
		if (!doc) return null;

		let documentParam: Record<string, any> | null = null;

		if (doc.url) {
			documentParam = {
				link: doc.url,
				...(doc.filename ? { filename: doc.filename } : {}),
			};
		} else if (doc.id) {
			documentParam = {
				id: doc.id,
				...(doc.filename ? { filename: doc.filename } : {}),
			};
		} else if (doc.base64) {
			const cleanBase64 = doc.base64.replace(/^data:.*?;base64,/, '');
			const buffer = Buffer.from(cleanBase64, 'base64');
			const fileName = doc.filename || 'documento.pdf';
			const mediaId = await this.uploadBufferToMeta(phoneId, userToken, buffer, fileName);
			documentParam = {
				id: mediaId,
				filename: fileName,
			};
		}

		if (!documentParam) return null;

		return {
			type: 'header',
			parameters: [
				{
					type: 'document',
					document: documentParam,
				},
			],
		};
	}

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

		const payload = {
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: dto.to,
			type: 'text',
			text: {
				body: dto.text.body,
			},

			// Caso tenha mensagem mencionada
			...(dto.quotedMessageId ? { context: { message_id: dto.quotedMessageId } } : {}),
		};

		return this.apiClient.post(connection.phone_id, connection.user_token, '/messages', payload);
	}

	async sendTemplateMessage(dto: MessageSendTemplateDto) {
		const connectionId = Number(dto.connectionId);
		const connection = await this.db.connections.findUnique({
			where: { id: connectionId },
		});

		if (!connection) {
			throw new NotFoundException(`Connection with ID ${connectionId} not found`);
		}

		const templateIdentifier = dto.templateName || dto.templateId;
		if (!templateIdentifier) {
			throw new BadRequestException('O campo templateName ou templateId é obrigatório para envio de template');
		}

		// Se o identificador for numérico (ID de template da Meta), consulta a Meta para resolver o nome
		let resolvedTemplateName = templateIdentifier;
		const isNumericId = /^\d+$/.test(templateIdentifier);

		if (isNumericId) {
			const templateData = await this.apiClient.get<any>(`/${templateIdentifier}`, connection.user_token);

			if (!templateData || !templateData.name) {
				throw new NotFoundException(`Template with ID ${templateIdentifier} not found in Meta API`);
			}

			resolvedTemplateName = templateData.name;
		}

		// Resolve documento para o cabeçalho se fornecido (url, base64 ou id)
		const headerComponent = await this.resolveDocumentHeaderComponent(connection.phone_id, connection.user_token, dto.document);

		// Monta os componentes com variáveis para o corpo se fornecidos
		const hasVariables = Array.isArray(dto.variables) && dto.variables.length > 0;
		const bodyComponent = hasVariables
			? {
					type: 'body',
					parameters: dto.variables!.map((val) => ({
						type: 'text',
						text: String(val),
					})),
				}
			: null;

		const components = [
			...(headerComponent ? [headerComponent] : []),
			...(bodyComponent ? [bodyComponent] : []),
		];

		const payload = {
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: dto.to,
			type: 'template',
			template: {
				name: resolvedTemplateName,
				language: {
					code: dto.language || 'pt_BR',
				},
				...(components.length > 0 ? { components } : {}),
			},
		};

		return this.apiClient.post(connection.phone_id, connection.user_token, '/messages', payload);
	}

	async sendTemplateMediaMessage(file: Express.Multer.File, dto: MessageSendTemplateMediaDto) {
		if (!file) {
			throw new BadRequestException('O arquivo físico do documento é obrigatório');
		}

		const connectionId = Number(dto.connectionId);
		const connection = await this.db.connections.findUnique({
			where: { id: connectionId },
		});

		if (!connection) {
			throw new NotFoundException(`Connection with ID ${connectionId} not found`);
		}

		const fileName = dto.filename || file.originalname || 'documento.pdf';
		const mediaId = await this.uploadBufferToMeta(connection.phone_id, connection.user_token, file.buffer, fileName, file.mimetype);

		const headerComponent = {
			type: 'header',
			parameters: [
				{
					type: 'document',
					document: {
						id: mediaId,
						filename: fileName,
					},
				},
			],
		};

		const parsedVars = this.parseVariables(dto.variables);
		const bodyComponent = parsedVars.length > 0
			? {
					type: 'body',
					parameters: parsedVars.map((val) => ({
						type: 'text',
						text: String(val),
					})),
				}
			: null;

		const components = [
			headerComponent,
			...(bodyComponent ? [bodyComponent] : []),
		];

		const payload = {
			messaging_product: 'whatsapp',
			recipient_type: 'individual',
			to: dto.to,
			type: 'template',
			template: {
				name: dto.templateName,
				language: {
					code: dto.language || 'pt_BR',
				},
				components,
			},
		};

		return this.apiClient.post(connection.phone_id, connection.user_token, '/messages', payload);
	}

	async sendMessageMedia(file: Express.Multer.File, dto: MessageSendMediaDto): Promise<MessageSendMediaResponseDto> {
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

		// Caso o arquivo seja um audio, chama o serviço de conversão de audio para o formato ogg (requerido pela meta)
		if (uploadedFileType === 'audio') {
			try {
				const convertFormData = new FormData();
				const audioBlob = new Blob([fileBuffer as any], { type: fileMimeType });
				convertFormData.append('audio', audioBlob, fileName);

				const ffmpegApiUrl = process.env.FFMPEG_API_URL || 'http://localhost:5004/convert';
				const convertRes = await fetch(ffmpegApiUrl, {
					method: 'POST',
					body: convertFormData,
				});

				if (!convertRes.ok) {
					const errorText = await convertRes.text();
					throw new Error(`Conversion API failed with status ${convertRes.status}: ${errorText}`);
				}

				const arrayBuffer = await convertRes.arrayBuffer();
				fileBuffer = Buffer.from(arrayBuffer);
				fileMimeType = 'audio/ogg; codecs=opus';
				fileName = fileName.replace(/\.[^/.]+$/, '') + '.ogg';
			} catch (err) {
				console.error('Error converting audio via ffmpeg-api:', err);

				throw new BadGatewayException('Ocorreu um erro interno na tratativa do formato de audio, entre em contato com o suporte!');
			}
		}

		// Caso o arquivo seja uma imagem webp, converte para jpg
		if (uploadedFileType === 'image' && fileMimeType === 'image/webp') {
			try {
				const convertFormData = new FormData();
				const imageBlob = new Blob([fileBuffer as any], { type: fileMimeType });
				convertFormData.append('image', imageBlob, fileName);

				const ffmpegApiUrl = (process.env.FFMPEG_API_URL || 'http://localhost:5004/convert').replace('/convert', '/convert-webp-to-jpg');
				const convertRes = await fetch(ffmpegApiUrl, {
					method: 'POST',
					body: convertFormData,
				});

				if (!convertRes.ok) {
					const errorText = await convertRes.text();
					throw new Error(`Conversion API failed with status ${convertRes.status}: ${errorText}`);
				}

				const arrayBuffer = await convertRes.arrayBuffer();
				fileBuffer = Buffer.from(arrayBuffer);
				fileMimeType = 'image/jpeg';
				fileName = fileName.replace(/\.[^/.]+$/, '') + '.jpg';
			} catch (err) {
				console.error('Error converting image via ffmpeg-api:', err);
				throw new BadGatewayException('Ocorreu um erro interno na tratativa do formato da imagem, entre em contato com o suporte!');
			}
		}

		// Configura o arquivo de mídia para enviar no form-data da requisição
		const formData = new FormData();

		// FormData nativo no Node aceita Blob para arquivos (usamos 'as any' para ignorar o erro restrito de tipagem do TS)
		const blob = new Blob([fileBuffer as any], { type: fileMimeType });

		formData.append('file', blob, fileName);
		formData.append('messaging_product', 'whatsapp');

		// Faz o upload da mídia para o whatsapp para recuperar o mediaId da mensagem
		const uploadedMedia = await this.apiClient.post<{ id: string }>(phoneId, userToken, '/media', formData).catch((err) => {
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

				// Caso seja uma mensagem de áudio esta config envia como se tivesse gravado
				...(dto.type === 'audio' ? { voice: true } : {}),

				// Caso seja uma mídia com texto (áudio não suporta caption)
				...(dto.caption && dto.type !== 'audio' ? { caption: dto.caption } : {}),
			},

			// Caso tenha mensagem mencionada
			...(dto.quotedMessageId ? { context: { message_id: dto.quotedMessageId } } : {}),
		};

		const response = await this.apiClient.post<MessageSendMediaResponseDto>(phoneId, userToken, '/messages', payload);

		const base64 = process.env.RETURN_MEDIA_BASE64 === 'true' ? convertBufferToBase64(fileBuffer as Buffer) : undefined;

		return {
			...response,
			mediaId: uploadedMedia.id,
			...(base64 ? { base64 } : {}),
		} as any;
	}

	async getMediaBuffer(connectionId: number, mediaId: string): Promise<{ buffer: Buffer; mimeType: string }> {
		const connection = await this.db.connections.findUnique({
			where: { id: connectionId },
		});

		if (!connection) {
			throw new NotFoundException(`Connection with ID ${connectionId} not found`);
		}

		// Buscar metadados da media pra obter a URL
		const mediaMetadata = await this.apiClient.get<{ url: string; mime_type: string }>(`/${mediaId}`, connection.user_token).catch((err) => {
			console.error('Error fetching media metadata:', err);
			throw new BadGatewayException('Ocorreu um erro ao buscar metadados da mídia!');
		});

		if (!mediaMetadata || !mediaMetadata.url) {
			throw new NotFoundException(`URL da mídia não encontrada na Meta.`);
		}

		// Baixar o arquivo binário
		const response = await fetch(mediaMetadata.url, {
			headers: { Authorization: `Bearer ${connection.user_token}` },
		});

		if (!response.ok) {
			throw new BadGatewayException(`Erro ao baixar a mídia: ${response.statusText}`);
		}

		const arrayBuffer = await response.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		return { buffer, mimeType: mediaMetadata.mime_type };
	}

	async downloadMedia(connectionId: number, mediaId: string, res: Response): Promise<void> {
		const { buffer, mimeType } = await this.getMediaBuffer(connectionId, mediaId);
		res.setHeader('Content-Type', mimeType);
		res.send(buffer);
	}

	async downloadMediaInBase64(connectionId: number, mediaId: string): Promise<{ base64: string; mimeType: string }> {
		const { buffer, mimeType } = await this.getMediaBuffer(connectionId, mediaId);
		const base64 = convertBufferToBase64(buffer);
		return { base64, mimeType };
	}
}
