import { Injectable } from '@nestjs/common';
import { ConnectionService } from '../services/connection.service';
import { ConnectionCreateDto } from '../dtos/ConnectionCreateDto';
import { ResponseModel } from 'src/shared/models/ResponseModel';
import { ConnectionResponseDto } from '../dtos/ConnectionResponseDto';
@Injectable()
export class ConnectionUseCase {
	constructor(private readonly connectionService: ConnectionService) { }

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
}
