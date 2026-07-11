import { Global, Module } from '@nestjs/common';
import { DbService } from './prisma.service';

@Global()
@Module({
	providers: [DbService],
	exports: [DbService],
})
export class PrismaModule { }
