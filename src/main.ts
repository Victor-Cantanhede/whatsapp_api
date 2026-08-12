import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule, { rawBody: true });
	app.enableCors();

	// Swagger config
	if (process.env.NODE_ENV === 'development') {
		const swaggerConfig = new DocumentBuilder()
			.setTitle('WhatsApp API - Abstraction')
			.setDescription('API documentation')
			.setVersion('1.0')
			.build();

		const theme = new SwaggerTheme();
		const darkTheme = theme.getBuffer(SwaggerThemeNameEnum.DRACULA);

		const document = SwaggerModule.createDocument(app, swaggerConfig);
		SwaggerModule.setup('api/swagger', app, document, {
			swaggerOptions: {
				persistAuthorization: true,
				displayRequestDuration: true,
				defaultModelsExpandDepth: -1,
			},
			customCss: darkTheme.toString(),
		});
	}

	app.connectMicroservice({
		transport: Transport.RMQ,
		options: {
			urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'],
			queue: 'meta_webhook_queue',
			noAck: false,
			queueOptions: {
				durable: true,
			},
		},
	});

	await app.startAllMicroservices();

	const PORT = process.env.PORT ?? 5003;
	await app.listen(PORT, '0.0.0.0');

	console.log(`Server running on port ${PORT}`);
}
bootstrap();
