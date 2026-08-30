'use client';

import * as React from 'react';
import { AlertCircle, AlertTriangle, HelpCircle, ShieldX, WifiOff } from 'lucide-react';

interface EmpatheticErrorProps {
  status: number;
  message?: string;
}

export function EmpatheticError({ status, message }: EmpatheticErrorProps) {
  if (status === 200 || status === 201 || status === 204) {
    return null;
  }

  let icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
  let title = 'Erro na requisição';
  let description = message || 'Ocorreu um erro ao processar sua requisição.';
  let borderClass = 'border-rose-900/40 bg-rose-950/20 text-rose-200';

  if (status === 0) {
    icon = <WifiOff className="w-5 h-5 text-amber-400 shrink-0" />;
    title = 'A requisição não chegou ao servidor (Erro de Rede / CORS)';
    description =
      'Possíveis causas: 1) O servidor backend não está rodando (verifique se executou npm run dev na API); 2) O endereço da Base URL está incorreto; 3) O CORS não está habilitado no backend.';
    borderClass = 'border-amber-900/40 bg-amber-950/20 text-amber-200';
  } else if (status === 400) {
    icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
    title = 'Dados recusados pelo backend (400 Bad Request)';
    description =
      'Verifique se você enviou algum campo obrigatório vazio, com formato inválido (ex: telefone sem DDI, texto onde deveria ser número) ou se o JSON possui erros de validação.';
    borderClass = 'border-amber-900/40 bg-amber-950/20 text-amber-200';
  } else if (status === 401) {
    icon = <ShieldX className="w-5 h-5 text-rose-400 shrink-0" />;
    title = 'Acesso Negado (401 Unauthorized)';
    description =
      'O token de autorização (API_KEY) está ausente ou inválido. Preencha a sua API Key interna na barra de Ambiente acima.';
    borderClass = 'border-rose-900/40 bg-rose-950/20 text-rose-200';
  } else if (status === 403) {
    icon = <ShieldX className="w-5 h-5 text-rose-400 shrink-0" />;
    title = 'Acesso Proibido (403 Forbidden)';
    description =
      'Sua chave não possui permissão para executar esta ação na API.';
    borderClass = 'border-rose-900/40 bg-rose-950/20 text-rose-200';
  } else if (status === 404) {
    icon = <HelpCircle className="w-5 h-5 text-amber-400 shrink-0" />;
    title = 'Rota ou Recurso não encontrado (404 Not Found)';
    description =
      'A rota não foi encontrada na API. Verifique se os parâmetros de rota (:id ou :connectionId) correspondem a registros válidos no banco de dados.';
    borderClass = 'border-amber-900/40 bg-amber-950/20 text-amber-200';
  } else if (status >= 500) {
    icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
    title = 'Erro Interno do Servidor (500 Internal Server Error)';
    description =
      'Ocorreu uma falha no processamento interno do servidor (ex: erro de banco de dados, falha de comunicação com os servidores da Meta ou token da Meta expirado).';
    borderClass = 'border-rose-900/40 bg-rose-950/20 text-rose-200';
  }

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${borderClass}`}>
      {icon}
      <div className="space-y-1">
        <h4 className="font-semibold">{title}</h4>
        <p className="opacity-90">{description}</p>
      </div>
    </div>
  );
}
