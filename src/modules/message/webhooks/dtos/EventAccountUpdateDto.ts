export class EventAccountUpdateDto {
	object: 'whatsapp_business_account';
	entry: Array<{
		id: string;
		time?: number;
		changes: Array<{
			field: 'account_update';
			value: {
				event: 'PARTNER_REMOVED' | string;
				waba_info?: {
					waba_id: string;
					owner_business_id: string;
				};
				disconnection_info?: {
					reason: 'ACCOUNT_DISCONNECTED' | string;
					initiated_by: 'USER' | string;
				};
			};
		}>;
	}>;
}
