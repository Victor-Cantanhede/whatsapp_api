import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ApiKeyGuard } from './guards/api-key.guard';
import { WebhookDispatcherService } from './services/webhook-dispatcher.service';
import { WebhookClientDevModule } from '../modules/webhook-client-dev/webhook-client-dev.module';

@Global()
@Module({
	imports: [WebhookClientDevModule],
	providers: [
		WebhookDispatcherService,
		{
			provide: APP_GUARD,
			useClass: ApiKeyGuard,
		},
	],
	exports: [WebhookDispatcherService],
})
export class SharedModule {}
