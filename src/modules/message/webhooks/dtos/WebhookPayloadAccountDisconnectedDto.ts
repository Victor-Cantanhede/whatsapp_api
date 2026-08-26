export class WebhookPayloadAccountDisconnectedDto {
	event: 'connection_disconnected';
	connectionId: number;
	connectionName: string;
	phoneNumberId: string;
	wabaId: string;
	timestamp: number;
	reason?: string;
	initiatedBy?: string;
}
