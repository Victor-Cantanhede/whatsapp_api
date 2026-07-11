import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DbService } from 'src/infrastructure/database/prisma/prisma.service';
import { ConnectionCreateDto } from '../dtos/ConnectionCreateDto';
import { ConnectionResponseDto } from '../dtos/ConnectionResponseDto';

@Injectable()
export class ConnectionService {
	constructor(private readonly db: DbService) { }

	async create(dto: ConnectionCreateDto): Promise<ConnectionResponseDto> {
		try {
			const createdConnection = await this.db.connections.create({ data: dto });

			return new ConnectionResponseDto(createdConnection);
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
				throw new Error('Já existe uma conexão com esses dados.');
			}

			throw error;
		}
	}

	async getAll(): Promise<ConnectionResponseDto[]> {
		const connections = await this.db.connections.findMany();

		return connections.map((c) => new ConnectionResponseDto(c));
	}

	async getById(id: number): Promise<ConnectionResponseDto | null> {
		const connection = await this.db.connections.findUnique({ where: { id } });
		if (!connection) return null;

		return new ConnectionResponseDto(connection);
	}

	async getByConnectionName(connection_name: string): Promise<ConnectionResponseDto | null> {
		const connection = await this.db.connections.findUnique({ where: { connection_name } });
		if (!connection) return null;

		return new ConnectionResponseDto(connection);
	}

	async getByUserToken(user_token: string): Promise<ConnectionResponseDto | null> {
		const connection = await this.db.connections.findUnique({ where: { user_token } });
		if (!connection) return null;

		return new ConnectionResponseDto(connection);
	}

	async getByPhoneId(phone_id: string): Promise<ConnectionResponseDto | null> {
		const connection = await this.db.connections.findUnique({ where: { phone_id } });
		if (!connection) return null;

		return new ConnectionResponseDto(connection);
	}

	async getByWabaId(waba_id: string): Promise<ConnectionResponseDto | null> {
		const connection = await this.db.connections.findUnique({ where: { waba_id } });
		if (!connection) return null;

		return new ConnectionResponseDto(connection);
	}
}
