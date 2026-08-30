import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { join } from 'path';
import { DevOnly } from './shared/decorators/dev-only.decorator';
import { Public } from './shared/decorators/public.decorator';

@Public()
@Controller()
export class AppController {
	@Get()
	@DevOnly()
	login(@Res() res: Response) {
		return res.sendFile(join(process.cwd(), 'sdk-login-facebook.html'));
	}

	@Get('api/docs')
	@DevOnly()
	docs(@Res() res: Response) {
		return res.sendFile(join(process.cwd(), 'api-tester.html'));
	}
}
