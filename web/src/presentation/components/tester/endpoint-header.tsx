'use client';

import * as React from 'react';
import { Copy, Check, Lock, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EndpointDefinition, HttpMethod } from '@/domain/shared/types';

interface EndpointHeaderProps {
  endpoint: EndpointDefinition;
}

export function EndpointHeader({ endpoint }: EndpointHeaderProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyPath = () => {
    navigator.clipboard.writeText(endpoint.path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMethodBadgeClass = (method: HttpMethod) => {
    switch (method) {
      case 'GET':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'POST':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'DELETE':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="border-b border-border/80 bg-card/20 px-6 py-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              {endpoint.name}
            </h1>
            {endpoint.requiresAuth ? (
              <Badge
                variant="outline"
                className="text-[10px] gap-1 py-0 px-2 border-amber-800/40 text-amber-400 bg-amber-950/20"
              >
                <Lock className="w-2.5 h-2.5" />
                API Key Obrigatória
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-[10px] gap-1 py-0 px-2 border-sky-800/40 text-sky-400 bg-sky-950/20"
              >
                <Globe className="w-2.5 h-2.5" />
                Público
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
            {endpoint.description}
          </p>
        </div>

        {/* Route badge with copy */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-border font-mono text-xs shadow-xs">
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getMethodBadgeClass(
                endpoint.method
              )}`}
            >
              {endpoint.method}
            </span>
            <span className="text-foreground/90 font-medium">{endpoint.path}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground"
              onClick={handleCopyPath}
              title="Copiar rota"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
