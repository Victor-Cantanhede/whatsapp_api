import { Module } from '@nestjs/common';
import { ConnectionController } from './controllers/connection.controller';
import { ConnectionUseCase } from './application/connection.use-case';
import { ConnectionService } from './services/connection.service';

@Module({
	controllers: [ConnectionController],
	providers: [ConnectionUseCase, ConnectionService],
	exports: [ConnectionService],
})
export class ConnectionModule {}
