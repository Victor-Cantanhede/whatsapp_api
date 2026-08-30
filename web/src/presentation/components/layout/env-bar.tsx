'use client';

import * as React from 'react';
import { Eye, EyeOff, KeyRound, Server, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEnvStore } from '@/application/stores/use-env-store';

export function EnvBar() {
  const { baseUrl, apiKey, setBaseUrl, setApiKey } = useEnvStore();
  const [showApiKey, setShowApiKey] = React.useState(false);

  return (
    <div className="border-b border-border/60 bg-card/40 px-4 md:px-6 py-3">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Server className="w-4 h-4 text-emerald-400" />
          <span>Configuração do Ambiente</span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto flex-1 lg:max-w-3xl justify-end">
          {/* Base URL */}
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Label htmlFor="base-url-input" className="text-xs text-muted-foreground whitespace-nowrap">
              Base URL:
            </Label>
            <div className="relative flex-1">
              <Input
                id="base-url-input"
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:5003"
                className="h-8 text-xs font-mono bg-background border-border"
              />
            </div>
          </div>

          {/* Authorization Token */}
          <div className="flex items-center gap-2 flex-1 min-w-[260px]">
            <Label htmlFor="api-key-input" className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-amber-400" />
              API Key:
            </Label>
            <div className="relative flex-1">
              <Input
                id="api-key-input"
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Insira sua API_KEY interna"
                className="h-8 text-xs font-mono bg-background border-border pr-8"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                title={showApiKey ? 'Ocultar token' : 'Exibir token'}
              >
                {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
