export class EventMessageStatusDto {
    object: string;
    entry: Array<{
        id: string;
        changes: Array<{
            field: string; // 'messages'
            value: {
                messaging_product: string;
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                statuses: Array<{
                    id: string;
                    status: string; // "sent", "delivered", "read", "failed", "deleted"
                    timestamp: string;
                    recipient_id: string;
                    conversation?: {
                        id: string;
                        origin: {
                            type: string;
                        };
                    };
                    pricing?: {
                        billable: boolean;
                        pricing_model: string;
                        category: string;
                    };
                    errors?: Array<{
                        code: number;
                        title: string;
                        message: string;
                        error_data?: any;
                    }>;
                }>;
            };
        }>;
    }>;
}
