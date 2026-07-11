import { ApiProperty } from '@nestjs/swagger';
import { ConnectionEntity } from '../entity/ConnectionEntity';

type _ConnectionCreateDto = Omit<ConnectionEntity, 'id' | 'createdAt' | 'updatedAt'>;

export abstract class ConnectionCreateDto implements _ConnectionCreateDto {
	@ApiProperty()
	connection_name!: string;

	@ApiProperty()
	user_token!: string;

	@ApiProperty()
	phone_id!: string;

	@ApiProperty()
	waba_id!: string;
}
