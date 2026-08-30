'use client';

import * as React from 'react';
import { Check, Code2, Copy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useCodeGenerator } from '@/application/hooks/use-code-generator';
import { EndpointDefinition } from '@/domain/shared/types';

interface CodeSnippetsProps {
  endpoint: EndpointDefinition;
  baseUrl: string;
  apiKey: string;
  pathParams?: Record<string, string | number>;
  queryParams?: Record<string, string | number>;
  body?: string;
  isFormData?: boolean;
}

export function CodeSnippets(props: CodeSnippetsProps) {
  const snippets = useCodeGenerator(props);
  const [activeTab, setActiveTab] = React.useState('curl');
  const [copied, setCopied] = React.useState(false);

  const getActiveCode = () => {
    switch (activeTab) {
      case 'curl':
        return snippets.curl;
      case 'fetch':
        return snippets.jsFetch;
      case 'axios':
        return snippets.axiosCode;
      case 'python':
        return snippets.pythonCode;
      default:
        return snippets.curl;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-border bg-card/30 overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/80 bg-secondary/20">
          <div className="flex items-center gap-2">
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Exemplo de Código
            </span>
          </div>

          <div className="flex items-center gap-2">
            <TabsList className="h-7 bg-background/80 p-0.5 border border-border">
              <TabsTrigger value="curl" className="text-[11px] h-6 px-2.5">
                cURL
              </TabsTrigger>
              <TabsTrigger value="fetch" className="text-[11px] h-6 px-2.5">
                Fetch (JS)
              </TabsTrigger>
              <TabsTrigger value="axios" className="text-[11px] h-6 px-2.5">
                Axios (TS)
              </TabsTrigger>
              <TabsTrigger value="python" className="text-[11px] h-6 px-2.5">
                Python
              </TabsTrigger>
            </TabsList>

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

        <TabsContent value="curl" className="m-0">
          <pre className="p-4 font-mono text-xs bg-zinc-950 text-zinc-200 dark:bg-black overflow-x-auto">
            {snippets.curl}
          </pre>
        </TabsContent>

        <TabsContent value="fetch" className="m-0">
          <pre className="p-4 font-mono text-xs bg-zinc-950 text-zinc-200 dark:bg-black overflow-x-auto">
            {snippets.jsFetch}
          </pre>
        </TabsContent>

        <TabsContent value="axios" className="m-0">
          <pre className="p-4 font-mono text-xs bg-zinc-950 text-zinc-200 dark:bg-black overflow-x-auto">
            {snippets.axiosCode}
          </pre>
        </TabsContent>

        <TabsContent value="python" className="m-0">
          <pre className="p-4 font-mono text-xs bg-zinc-950 text-zinc-200 dark:bg-black overflow-x-auto">
            {snippets.pythonCode}
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
}
