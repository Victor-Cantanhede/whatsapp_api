export class EventMessageReceivedDto {
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
					profile: {
						name: string;
					};
					wa_id: string;
					user_id: string;
				}>;
				messages: Array<{
					from: string;
					from_user_id: string;
					id: string;
					timestamp: string;
					type: 'text' | 'audio' | 'video' | 'image' | 'document' | string;
					context?: {
						from: string;
						id: string;
					};
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
			field: 'messages';
		}>;
	}>;
}
