export class EventMessageTextEchoDto {
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
          text: {
            body: string;
          };
          type: 'text';
        }>;
      };
      field: 'smb_message_echoes';
    }>;
  }>;
}
