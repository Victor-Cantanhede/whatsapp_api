import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
	imports: [
		ClientsModule.registerAsync([
			{
				name: 'RABBITMQ_SERVICE',
				imports: [ConfigModule],
				useFactory: (configService: ConfigService) => ({
					transport: Transport.RMQ,
					options: {
						urls: [configService.get<string>('RABBITMQ_URL') || 'amqp://guest:guest@localhost:5675'],
						queue: 'meta_webhook_queue',
						queueOptions: {
							durable: true,
						},
					},
				}),
				inject: [ConfigService],
			},
		]),
	],
	exports: [ClientsModule],
})
export class RabbitMQModule {}
