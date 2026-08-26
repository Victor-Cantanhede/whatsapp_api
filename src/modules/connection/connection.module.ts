import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConnectionController } from './controllers/connection.controller';
import { ConnectionUseCase } from './application/connection.use-case';
import { ConnectionService } from './services/connection.service';
import { WhatsAppApiModule } from 'src/infrastructure/whatsapp-api/whatsapp-api.module';
import { AccountUpdateConsumer } from './consumers/account-update.consumer';
import { WebhookClientDevModule } from '../webhook-client-dev/webhook-client-dev.module';

@Module({
	imports: [HttpModule, WhatsAppApiModule, WebhookClientDevModule],
	controllers: [ConnectionController, AccountUpdateConsumer],
	providers: [ConnectionUseCase, ConnectionService],
	exports: [ConnectionService],
})
export class ConnectionModule {}


