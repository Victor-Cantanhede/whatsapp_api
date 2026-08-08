export class WebhookPayloadStatusDto {
    connectionId: number;
    phoneNumberId: string;
    waId: string; // O mesmo que recipient_id
    providerMessageId: string; // ID da mensagem wamid.HBg...
    timestamp: string;
    status: string; // sent, delivered, read, failed
    errors?: Array<{
        code: number;
        title: string;
        message: string;
        error_data?: any;
    }>;
}
