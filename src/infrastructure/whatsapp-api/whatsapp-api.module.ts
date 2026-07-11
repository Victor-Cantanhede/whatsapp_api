import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WhatsAppApiClient } from './whatsapp-api.client';

@Global()
@Module({
	imports: [HttpModule],
	providers: [WhatsAppApiClient],
	exports: [WhatsAppApiClient],
})
export class WhatsAppApiModule {}
