import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator para marcar rotas ou controllers como públicos,
 * isentando-os da exigência do header de Authorization / API_KEY.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
