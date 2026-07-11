export class EventMessageTextReceivedDto {
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
          text: {
            body: string;
          };
          type: 'text';
        }>;
      };
      field: 'messages';
    }>;
  }>;
}

