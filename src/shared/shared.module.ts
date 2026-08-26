import { Global, Module } from '@nestjs/common';
import { WebhookDispatcherService } from './services/webhook-dispatcher.service';
import { WebhookClientDevModule } from '../modules/webhook-client-dev/webhook-client-dev.module';

@Global()
@Module({
	imports: [WebhookClientDevModule],
	providers: [WebhookDispatcherService],
	exports: [WebhookDispatcherService],
})
export class SharedModule {}
