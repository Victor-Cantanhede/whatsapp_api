export class WebhookPayloadMessageDto {
    connectionId: number;
    phoneNumberId: string;
    waId: string;
    contactName?: string;
    providerMessageId: string;
    timestamp: string;
    type: string;
    text?: string;
    fromMe: boolean;
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
}
