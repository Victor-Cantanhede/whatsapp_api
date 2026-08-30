'use client';

import * as React from 'react';
import { History, Trash2, ArrowUpRight, Clock, CheckCircle2, XCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useHistoryStore } from '@/application/stores/use-history-store';
import { RequestHistoryItem } from '@/domain/shared/types';

interface HistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectHistoryItem: (item: RequestHistoryItem) => void;
}

export function HistorySheet({
  open,
  onOpenChange,
  onSelectHistoryItem,
}: HistorySheetProps) {
  const { history, clearHistory } = useHistoryStore();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-background border-border flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <SheetTitle className="text-base">Histórico de Chamadas</SheetTitle>
            </div>
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-rose-400 gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar
              </Button>
            )}
          </div>
          <SheetDescription className="text-xs">
            Últimas requisições disparadas pelo Developer Tester.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Clock className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs">Nenhuma requisição registrada ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => {
                const date = new Date(item.timestamp).toLocaleTimeString();
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-border bg-card/40 hover:bg-card/70 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary text-foreground">
                          {item.method}
                        </span>
                        <span className="font-medium text-xs text-foreground truncate max-w-[170px]">
                          {item.endpointName}
                        </span>
                      </div>

                      <Badge
                        variant={item.isError ? 'destructive' : 'secondary'}
                        className="font-mono text-[10px] py-0"
                      >
                        {item.status ? `${item.status}` : 'Err'}
                      </Badge>
                    </div>

                    <div className="font-mono text-[11px] text-muted-foreground truncate">
                      {item.url}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>{date}</span>
                        <span>•</span>
                        <span>{item.durationMs}ms</span>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onSelectHistoryItem(item);
                          onOpenChange(false);
                        }}
                        className="h-6 px-2 text-[10px] font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 gap-1"
                      >
                        Carregar
                        <ArrowUpRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
