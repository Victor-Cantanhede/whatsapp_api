export class EventMessageEchoDto {
	object: 'whatsapp_business_account';
	entry: Array<{
		id: string;
		changes: Array<{
			value: {
				messaging_product: 'whatsapp';
				metadata: {
					display_phone_number: string;
					phone_number_id: string;
				};
				contacts: Array<{
					wa_id: string;
					user_id: string;
				}>;
				message_echoes: Array<{
					from: string;
					to: string;
					id: string;
					to_user_id: string;
					timestamp: string;
					type: 'text' | 'audio' | 'video' | 'image' | 'document' | string;
					text?: {
						body: string;
					};
					audio?: {
						mime_type: string;
						sha256: string;
						id: string;
						url: string;
						voice?: boolean;
					};
					video?: {
						mime_type: string;
						sha256: string;
						id: string;
						url: string;
					};
					image?: {
						mime_type: string;
						sha256: string;
						id: string;
						url: string;
					};
					document?: {
						filename: string;
						mime_type: string;
						sha256: string;
						id: string;
						url: string;
					};
				}>;
			};
			field: 'smb_message_echoes';
		}>;
	}>;
}
