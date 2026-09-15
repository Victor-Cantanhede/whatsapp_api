import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ConnectionEntity } from '../entity/ConnectionEntity';

type _ConnectionCreateDto = Omit<ConnectionEntity, 'id' | 'createdAt' | 'updatedAt'>;

export class ConnectionCreateDto implements _ConnectionCreateDto {
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	connection_name!: string;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	user_token!: string;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	phone_id!: string;

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	waba_id!: string;
}
