import { ConnectionEntity } from '../entity/ConnectionEntity';

export class ConnectionResponseDto implements ConnectionEntity {
	id: number;
	connection_name: string;
	user_token: string;
	phone_id: string;
	waba_id: string;
	createdAt: Date;
	updatedAt: Date;

	constructor(data: ConnectionEntity) {
		this.id = data.id;
		this.connection_name = data.connection_name;
		this.user_token = data.user_token;
		this.phone_id = data.phone_id;
		this.waba_id = data.waba_id;
		this.createdAt = data.createdAt;
		this.updatedAt = data.updatedAt;
	}
}
