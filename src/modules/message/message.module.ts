import { Module } from '@nestjs/common';
import { ConnectionModule } from '../connection/connection.module';
import { MessageService } from './services/message.service';
import { MessageWebhook } from './webhooks/message.webhook';
import { MessageController } from './controllers/message.controller';
import { MessageUseCase } from './application/message.use-case';
import { RabbitMQModule } from '../../infrastructure/rabbitmq/rabbitmq.module';
import { MessageConsumer } from './consumers/message.consumer';

@Module({
	imports: [ConnectionModule, RabbitMQModule],
	controllers: [MessageWebhook, MessageController, MessageConsumer],
	providers: [MessageService, MessageUseCase],
})
export class MessageModule {}
