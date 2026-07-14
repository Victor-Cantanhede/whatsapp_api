export class WebhookPayloadMessageTextDto {
    connectionId: number;
    phoneNumberId: string;
    waId: string;
    contactName?: string;
    providerMessageId: string;
    timestamp: string;
    type: string;
    text: string;
    fromMe: boolean;
}
