'use client';

import * as React from 'react';
import { Search, ShieldAlert, Sparkles, Terminal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EndpointDefinition, HttpMethod } from '@/domain/shared/types';

interface SidebarProps {
  endpoints: EndpointDefinition[];
  selectedEndpoint: EndpointDefinition | null;
  onSelectEndpoint: (ep: EndpointDefinition) => void;
}

export function Sidebar({
  endpoints,
  selectedEndpoint,
  onSelectEndpoint,
}: SidebarProps) {
  const [search, setSearch] = React.useState('');

  const filteredEndpoints = React.useMemo(() => {
    if (!search.trim()) return endpoints;
    const q = search.toLowerCase();
    return endpoints.filter(
      (ep) =>
        ep.name.toLowerCase().includes(q) ||
        ep.path.toLowerCase().includes(q) ||
        ep.category.toLowerCase().includes(q) ||
        ep.method.toLowerCase().includes(q)
    );
  }, [endpoints, search]);

  const categories = React.useMemo(() => {
    const map = new Map<string, EndpointDefinition[]>();
    filteredEndpoints.forEach((ep) => {
      const list = map.get(ep.category) || [];
      list.push(ep);
      map.set(ep.category, list);
    });
    return Array.from(map.entries());
  }, [filteredEndpoints]);

  const getMethodBadge = (method: HttpMethod) => {
    switch (method) {
      case 'GET':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            GET
          </span>
        );
      case 'POST':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            POST
          </span>
        );
      case 'DELETE':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            DEL
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {method}
          </span>
        );
    }
  };

  return (
    <aside className="w-full md:w-80 lg:w-96 flex flex-col border-r border-border/80 bg-card/20 shrink-0 h-full">
      {/* Search Bar */}
      <div className="p-3.5 border-b border-border/60">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar endpoint, rota ou método..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs font-mono bg-background/80 border-border placeholder:text-muted-foreground/70"
          />
        </div>
      </div>

      {/* Categories & Endpoints List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {categories.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              Nenhum endpoint encontrado para &quot;{search}&quot;
            </div>
          ) : (
            categories.map(([category, items]) => (
              <div key={category} className="space-y-1">
                <div className="px-2 py-1 text-[11px] font-bold font-mono tracking-wider uppercase text-muted-foreground/80 flex items-center gap-1.5">
                  <span>{category}</span>
                  <span className="text-[10px] text-muted-foreground/50">
                    ({items.length})
                  </span>
                </div>

                <div className="space-y-0.5">
                  {items.map((ep) => {
                    const isSelected = selectedEndpoint?.id === ep.id;
                    return (
                      <button
                        key={ep.id}
                        onClick={() => onSelectEndpoint(ep)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all flex flex-col gap-1 border ${
                          isSelected
                            ? 'bg-secondary text-foreground border-border font-medium shadow-xs ring-1 ring-emerald-500/30'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40 border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full gap-2">
                          <span className="font-medium truncate text-xs text-foreground/90">
                            {ep.name}
                          </span>
                          {getMethodBadge(ep.method)}
                        </div>
                        <div className="font-mono text-[11px] text-muted-foreground/70 truncate flex items-center gap-1">
                          <span>{ep.path}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
