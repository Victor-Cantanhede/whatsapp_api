'use client';

import * as React from 'react';
import {
  Check,
  Copy,
  Clock,
  Download,
  Terminal,
  FileDown,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExecuteRequestResult } from '@/infrastructure/api/client';
import { EmpatheticError } from './empathetic-error';

interface ResponsePanelProps {
  result: ExecuteRequestResult | null;
  isLoading: boolean;
}

export function ResponsePanel({ result, isLoading }: ResponsePanelProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (!result) return;
    const textToCopy =
      typeof result.data === 'string'
        ? result.data
        : JSON.stringify(result.data, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: number, isOk: boolean) => {
    if (status === 0) {
      return (
        <Badge variant="destructive" className="font-mono text-xs">
          Erro de Rede
        </Badge>
      );
    }
    if (isOk) {
      return (
        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs">
          {status} OK
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="font-mono text-xs">
        {status} {result?.statusText || 'Error'}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-xl border border-border bg-card/20 min-h-[350px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <span className="text-xs font-mono text-muted-foreground animate-pulse">
            Disparando requisição e aguardando resposta da API...
          </span>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-border bg-card/10 min-h-[350px] text-center">
        <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center text-muted-foreground mb-3">
          <Terminal className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-medium text-foreground">Console de Resposta</h3>
        <p className="text-xs text-muted-foreground max-w-xs mt-1">
          Configure os parâmetros e clique em &quot;Disparar Requisição&quot; para visualizar
          o payload retornado e a telemetria.
        </p>
      </div>
    );
  }

  const isMediaBlob = Boolean(result.blobUrl);
  const isImage = result.contentType?.includes('image');
  const isAudio = result.contentType?.includes('audio');
  const isVideo = result.contentType?.includes('video');

  return (
    <div className="flex-1 flex flex-col rounded-xl border border-border bg-card/30 overflow-hidden min-h-[350px]">
      {/* Response Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/80 bg-secondary/20">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            Resposta
          </span>
          {getStatusBadge(result.status, result.isOk)}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span>{result.durationMs} ms</span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground gap-1"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Copiar</span>
          </Button>
        </div>
      </div>

      {/* Response Body */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[500px]">
        {/* Empathetic Error */}
        {!result.isOk && (
          <EmpatheticError
            status={result.status}
            message={result.data?.message || result.rawResponse}
          />
        )}

        {/* Media Preview if returned */}
        {isMediaBlob && (
          <div className="p-4 rounded-xl border border-border bg-background space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-400">
                ✅ Mídia binária recebida ({((result.blobSize || 0) / 1024).toFixed(1)} KB)
              </span>
              <a
                href={result.blobUrl}
                download="whatsapp-media-file"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-foreground hover:bg-secondary/80 transition-colors border border-border"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar Arquivo
              </a>
            </div>

            {isImage && (
              <div className="flex justify-center p-2 bg-zinc-950 rounded-lg overflow-hidden">
                <img
                  src={result.blobUrl}
                  alt="WhatsApp Media Preview"
                  className="max-h-64 object-contain rounded"
                />
              </div>
            )}

            {isAudio && (
              <div className="p-2 bg-zinc-950 rounded-lg">
                <audio controls className="w-full">
                  <source src={result.blobUrl} type={result.contentType} />
                  Seu navegador não suporta áudio HTML5.
                </audio>
              </div>
            )}

            {isVideo && (
              <div className="flex justify-center p-2 bg-zinc-950 rounded-lg">
                <video controls className="max-h-64 rounded">
                  <source src={result.blobUrl} type={result.contentType} />
                  Seu navegador não suporta vídeo HTML5.
                </video>
              </div>
            )}
          </div>
        )}

        {/* JSON / Text Output */}
        <pre className="p-4 rounded-xl font-mono text-xs bg-zinc-950 text-zinc-200 dark:bg-black dark:text-zinc-100 overflow-x-auto border border-zinc-800 leading-relaxed shadow-inner">
          {typeof result.data === 'string'
            ? result.data
            : JSON.stringify(result.data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
