import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ConnectionUseCase } from '../application/connection.use-case';
import { ConnectionCreateDto } from '../dtos/ConnectionCreateDto';
import { ConnectionResponseDto } from '../dtos/ConnectionResponseDto';
import { ResponseModel } from 'src/shared/models/ResponseModel';

@Controller('connection')
export class ConnectionController {
	constructor(private readonly connectionUseCase: ConnectionUseCase) {}

	@Post('create')
	async create(@Body() dto: ConnectionCreateDto): Promise<ResponseModel<ConnectionResponseDto>> {
		return this.connectionUseCase.create(dto);
	}

	@Get('getAll')
	async getAll(): Promise<ResponseModel<ConnectionResponseDto[]>> {
		return this.connectionUseCase.gelAll();
	}

	@Get('getById')
	async getById(@Query('id') id: string): Promise<ResponseModel<ConnectionResponseDto>> {
		return this.connectionUseCase.getById(Number(id));
	}

	@Get('getByConnectionName')
	async getByConnectionName(@Query('connection_name') connection_name: string) {
		return this.connectionUseCase.getByConnectionName(connection_name);
	}

	@Get('getByUserToken')
	async getByUserToken(@Query('user_token') user_token: string) {
		return this.connectionUseCase.getByUserToken(user_token);
	}

	@Get('getByPhoneId')
	async getByPhoneId(@Query('phone_id') phone_id: string) {
		return this.connectionUseCase.getByPhoneId(phone_id);
	}

	@Get('getByWabaId')
	async getByWabaId(@Query('waba_id') waba_id: string) {
		return this.connectionUseCase.getByWabaId(waba_id);
	}
}
