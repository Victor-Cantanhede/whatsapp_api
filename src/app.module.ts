import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConnectionModule } from './modules/connection/connection.module';
import { PrismaModule } from './infrastructure/database/prisma/prisma.module';
import { MessageModule } from './modules/message/message.module';
import { WhatsAppApiModule } from './infrastructure/whatsapp-api/whatsapp-api.module';
import { AppController } from './app.controller';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		PrismaModule,
		ConnectionModule,
		MessageModule,
		WhatsAppApiModule,
	],
	controllers: [AppController],
})
export class AppModule {}
