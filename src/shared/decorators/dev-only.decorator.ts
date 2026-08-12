import { UseGuards, applyDecorators } from '@nestjs/common';
import { DevOnlyGuard } from '../guards/dev-only.guard';

/**
 * Decorator para bloquear rotas em produção.
 * A rota só será acessível se a variável de ambiente NODE_ENV for "development".
 * Caso contrário, retorna 404 (Not Found).
 */
export function DevOnly() {
  return applyDecorators(UseGuards(DevOnlyGuard));
}
