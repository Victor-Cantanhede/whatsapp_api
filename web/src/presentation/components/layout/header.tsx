'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Layers,
  Radio,
  RefreshCw,
  Sparkles,
  Webhook,
  History as HistoryIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ThemeToggle } from '../theme-toggle';
import { useEnvStore } from '@/application/stores/use-env-store';
import { useConnectionsStore } from '@/application/stores/use-connections-store';

interface HeaderProps {
  onOpenHistory?: () => void;
}

export function Header({ onOpenHistory }: HeaderProps) {
  const pathname = usePathname();
  const { selectedConnectionId, setSelectedConnectionId } = useEnvStore();
  const { connections, isLoading, fetchConnections } = useConnectionsStore();

  React.useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40 transition-all shadow-sm">
              <Radio className="w-5 h-5 text-emerald-500 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-foreground text-base">
                  WhatsApp API
                </span>
                <Badge
                  variant="secondary"
                  className="text-[10px] font-mono font-medium py-0 px-1.5 bg-emerald-950/40 text-emerald-400 border-emerald-800/40"
                >
                  Pro DX
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono hidden sm:inline">
                Meta Cloud API Gateway
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 ml-6 pl-6 border-l border-border/60">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                pathname === '/'
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                API Explorer
              </span>
            </Link>
            <Link
              href="/webhooks"
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                pathname === '/webhooks'
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Webhook className="w-3.5 h-3.5" />
                Webhooks & Multi-Tenancy
              </span>
            </Link>
          </nav>
        </div>

        {/* Right Action Tools: Connection Quick Selector, History, Theme */}
        <div className="flex items-center gap-2.5">
          {/* Quick Connection Switcher */}
          <div className="flex items-center gap-1.5 bg-secondary/40 border border-border/60 rounded-lg p-1">
            <div className="flex items-center gap-1 pl-2 pr-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[11px] text-muted-foreground font-medium hidden lg:inline">
                Conexão Ativa:
              </span>
            </div>

            <Select
              value={selectedConnectionId ? String(selectedConnectionId) : ''}
              onValueChange={(val) => setSelectedConnectionId(val ? Number(val) : null)}
            >
              <SelectTrigger className="h-7 w-[130px] sm:w-[170px] text-xs font-mono border-0 bg-transparent focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Selecione ID" />
              </SelectTrigger>
              <SelectContent align="end" className="border-border bg-popover text-xs font-mono">
                {connections.length === 0 ? (
                  <div className="p-2 text-center text-muted-foreground text-[11px]">
                    Nenhuma conexão encontrada
                  </div>
                ) : (
                  connections.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)} className="cursor-pointer">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-bold text-emerald-400">ID #{c.id}</span>
                        <span className="truncate text-muted-foreground text-[11px]">
                          ({c.connection_name})
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => fetchConnections()}
              disabled={isLoading}
              title="Recarregar conexões da API"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* History Button */}
          {onOpenHistory && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenHistory}
              className="h-9 px-3 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border-border/80 bg-background"
            >
              <HistoryIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Histórico</span>
            </Button>
          )}

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
