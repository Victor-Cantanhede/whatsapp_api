import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { join } from 'path';
import { ConnectionUseCase } from '../application/connection.use-case';
import { ConnectionCreateDto } from '../dtos/ConnectionCreateDto';
import { ConnectionOauthCallbackDto } from '../dtos/ConnectionOauthCallbackDto';
import { ConnectionResponseDto } from '../dtos/ConnectionResponseDto';
import { ResponseModel } from 'src/shared/models/ResponseModel';

@Controller('connection')
export class ConnectionController {
	constructor(private readonly connectionUseCase: ConnectionUseCase) { }

	@Get('facebook-config')
	getFacebookConfig() {
		return {
			appId: process.env.META_APP_ID,
			configId: process.env.META_CONFIGURATION_ID,
			version: process.env.CLOUD_API_VERSION || 'v25.0',
		};
	}

	@Post('oauth-callback')
	async oauthCallback(@Body() dto: ConnectionOauthCallbackDto): Promise<ResponseModel<ConnectionResponseDto>> {
		return this.connectionUseCase.processOauthCallback(dto);
	}

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
