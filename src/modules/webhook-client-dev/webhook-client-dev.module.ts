import { Module } from '@nestjs/common';
import { WebhookClientDevService } from './services/webhook-client-dev.service';

@Module({
	providers: [WebhookClientDevService],
	exports: [WebhookClientDevService],
})
export class WebhookClientDevModule {}
