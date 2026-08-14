import { Injectable } from '@nestjs/common';
import { ConnectionService } from '../services/connection.service';
import { ConnectionCreateDto } from '../dtos/ConnectionCreateDto';
import { ResponseModel } from 'src/shared/models/ResponseModel';
import { ConnectionResponseDto } from '../dtos/ConnectionResponseDto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConnectionOauthCallbackDto } from '../dtos/ConnectionOauthCallbackDto';

@Injectable()
export class ConnectionUseCase {
	constructor(
		private readonly connectionService: ConnectionService,
		private readonly httpService: HttpService,
	) { }

	private async getConnectionQuery(fn: () => Promise<ConnectionResponseDto | null>): Promise<ResponseModel<ConnectionResponseDto>> {
		const response = new ResponseModel<ConnectionResponseDto>();

		try {
			const connection = await fn();

			response.data = connection;
			response.message = 'Consulta realizada com sucesso!';

			if (!connection) {
				response.message = 'Conexão com o whatsapp não localizada!';
				response.success = false;
			}
		} catch (error) {
			console.log(error);

			response.message = 'Ocorreu um erro ao consultar conexão com o whatsapp!';
			response.success = false;
		}

		return response;
	}

	async processOauthCallback(dto: ConnectionOauthCallbackDto): Promise<ResponseModel<ConnectionResponseDto>> {
		const response = new ResponseModel<ConnectionResponseDto>();

		const version = process.env.CLOUD_API_VERSION || 'v25.0';
		const appId = process.env.META_APP_ID;
		const appSecret = process.env.TOKEN_APP_META;

		try {
			const tokenUrl = `https://graph.facebook.com/${version}/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${dto.code}`;

			const tokenRes = await firstValueFrom(this.httpService.post(tokenUrl));
			const userToken = tokenRes.data.access_token;

			const phoneUrl = `https://graph.facebook.com/${version}/${dto.waba_id}/phone_numbers?fields=id&access_token=${userToken}`;
			const phoneRes = await firstValueFrom(this.httpService.get(phoneUrl));
			const phoneId = phoneRes.data.data[0].id;

			const webhookUrl = `https://graph.facebook.com/${version}/${dto.waba_id}/subscribed_apps`;
			await firstValueFrom(
				this.httpService.post(
					webhookUrl,
					{},
					{
						headers: { Authorization: `Bearer ${userToken}` },
					},
				),
			);

			const createDto: ConnectionCreateDto = {
				connection_name: dto.connection_name || 'Nova Conexão Embedded',
				user_token: userToken,
				waba_id: dto.waba_id,
				phone_id: phoneId,
			} as ConnectionCreateDto;

			return await this.create(createDto);
		} catch (error: any) {
			console.log('Error processing oauth callback:', error?.response?.data || error);

			response.success = false;
			response.message = 'Falha ao processar o login com o Facebook.';

			return response;
		}
	}

	async create(dto: ConnectionCreateDto): Promise<ResponseModel<ConnectionResponseDto>> {
		const response = new ResponseModel<ConnectionResponseDto>();

		try {
			const createdConnection = await this.connectionService.create(dto);

			response.data = createdConnection;
			response.message = 'Conexão efetuada com sucesso!';
		} catch (error) {
			const err = error as any;

			response.message = err.message || 'Ocorreu um erro ao criar conexão com o whatsapp!';
			response.success = false;

			console.log(error);
		}

		return response;
	}

	async gelAll(): Promise<ResponseModel<ConnectionResponseDto[]>> {
		const response = new ResponseModel<ConnectionResponseDto[]>();

		try {
			const connections = await this.connectionService.getAll();

			response.data = connections;
			response.message = 'Consulta realizada com sucesso!';
		} catch (error) {
			const err = error as any;

			response.message = 'Ocorreu um erro ao consultar conexões com o whatsapp!';
			response.success = false;

			console.log(error);
		}

		return response;
	}

	async getById(id: number): Promise<ResponseModel<ConnectionResponseDto>> {
		return this.getConnectionQuery(() => this.connectionService.getById(id));
	}

	async getByConnectionName(connection_name: string): Promise<ResponseModel<ConnectionResponseDto>> {
		return this.getConnectionQuery(() => this.connectionService.getByConnectionName(connection_name));
	}

	async getByUserToken(user_token: string): Promise<ResponseModel<ConnectionResponseDto>> {
		return this.getConnectionQuery(() => this.connectionService.getByUserToken(user_token));
	}

	async getByPhoneId(phone_id: string): Promise<ResponseModel<ConnectionResponseDto>> {
		return this.getConnectionQuery(() => this.connectionService.getByPhoneId(phone_id));
	}

	async getByWabaId(waba_id: string): Promise<ResponseModel<ConnectionResponseDto>> {
		return this.getConnectionQuery(() => this.connectionService.getByWabaId(waba_id));
	}

	async disconnect(id: number): Promise<ResponseModel<null>> {
		const response = new ResponseModel<null>();

		try {
			const connection = await this.connectionService.getById(id);
			if (!connection) {
				response.success = false;
				response.message = 'Conexão não encontrada.';
				return response;
			}

			await this.connectionService.delete(id);

			response.success = true;
			response.message = 'Conexão desconectada e removida com sucesso.';
			response.data = null;
		} catch (error: any) {
			console.log('Erro interno ao desconectar:', error);
			response.success = false;
			response.message = 'Ocorreu um erro interno ao processar a desconexão.';
		}

		return response;
	}
}
