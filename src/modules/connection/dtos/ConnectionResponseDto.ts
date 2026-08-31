import { ConnectionEntity } from '../entity/ConnectionEntity';

export class ConnectionResponseDto implements Omit<ConnectionEntity, 'user_token'> {
	id: number;
	connection_name: string;
	phone_id: string;
	waba_id: string;
	createdAt: Date;
	updatedAt: Date;

	constructor(data: ConnectionEntity) {
		this.id = data.id;
		this.connection_name = data.connection_name;
		this.phone_id = data.phone_id;
		this.waba_id = data.waba_id;
		this.createdAt = data.createdAt;
		this.updatedAt = data.updatedAt;
	}
}
