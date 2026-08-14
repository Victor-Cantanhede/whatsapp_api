import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConnectionController } from './controllers/connection.controller';
import { ConnectionUseCase } from './application/connection.use-case';
import { ConnectionService } from './services/connection.service';
import { WhatsAppApiModule } from 'src/infrastructure/whatsapp-api/whatsapp-api.module';

@Module({
	imports: [HttpModule, WhatsAppApiModule],
	controllers: [ConnectionController],
	providers: [ConnectionUseCase, ConnectionService],
	exports: [ConnectionService],
})
export class ConnectionModule {}
