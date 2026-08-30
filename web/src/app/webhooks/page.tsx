'use client';

import * as React from 'react';
import {
  Webhook,
  Copy,
  Check,
  ShieldCheck,
  Network,
  Radio,
  ExternalLink,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Header } from '@/presentation/components/layout/header';
import { EnvBar } from '@/presentation/components/layout/env-bar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function WebhooksPage() {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Payload copiado para a área de transferência!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const payloadMessageReceived = `{
  "event": "message_received",
  "connectionId": 1,
  "data": {
    "from": "5511999999999",
    "id": "wamid.HBgLNTUxMjk5OTk5OTk5FQIAERgSMzAyQ0U2QUQ5MDY1OUQ4OTFBAA==",
    "timestamp": "1710000000",
    "type": "text",
    "text": {
      "body": "Olá! Gostaria de saber mais informações sobre o serviço."
    }
  }
}`;

  const payloadStatusUpdated = `{
  "event": "status_updated",
  "connectionId": 1,
  "data": {
    "id": "wamid.HBgLNTUxMjk5OTk5OTk5FQIAERgSMzAyQ0U2QUQ5MDY1OUQ4OTFBAA==",
    "status": "delivered",
    "timestamp": "1710000005",
    "recipient_id": "5511999999999",
    "conversation": {
      "id": "c0123456789",
      "origin": { "type": "user_initiated" }
    }
  }
}`;

  const payloadConnectionDisconnected = `{
  "event": "connection_disconnected",
  "connectionId": 1,
  "connectionName": "Minha Empresa WhatsApp",
  "phoneNumberId": "11987654321",
  "wabaId": "10987654321",
  "timestamp": 1787711901,
  "reason": "ACCOUNT_DISCONNECTED",
  "initiatedBy": "USER"
}`;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-emerald-500 selection:text-white">
      <Header />
      <EnvBar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        {/* Title & Overview Banner */}
        <div className="p-6 md:p-8 rounded-2xl border border-border bg-gradient-to-b from-card/60 to-card/20 space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Webhook className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Recepção de Webhooks & Multi-Tenancy Dev
                </h1>
                <Badge
                  variant="outline"
                  className="bg-emerald-950/40 text-emerald-400 border-emerald-800/40 text-xs font-mono"
                >
                  Meta Cloud Proxy
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Como os eventos de mensagens e status são filtrados, validados e propagados para a sua aplicação.
              </p>
            </div>
          </div>

          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            Como o WhatsApp funciona de modo assíncrono, as confirmações de envio e as mensagens
            recebidas dos clientes são emitidas pela Meta através de requisições HTTP (Webhooks).
            Esta API atua como um <strong>Gateway de Webhooks</strong>: ela valida a assinatura
            criptográfica da Meta, decodifica a estrutura complexa e repassa um payload padronizado e
            limpo para a sua URL de webhook configurada.
          </p>
        </div>

        {/* Multi-Tenancy Local Development Guide */}
        <div className="p-6 rounded-2xl border border-border bg-card/30 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm uppercase tracking-wider">
            <Network className="w-4 h-4" />
            <span>Como testar Webhooks no seu ambiente de Desenvolvimento</span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            A Meta permite cadastrar apenas <strong>uma única URL de Webhook por aplicativo</strong>. Em um time de desenvolvimento com múltiplos devs, apontar o webhook para a máquina de uma única pessoa bloquearia os demais ou quebraria a produção.
            Para resolver isso de forma elegante, a API implementa o recurso de <strong>Multi-Tenancy de Webhooks</strong>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-border bg-background space-y-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs font-mono">
                1
              </div>
              <h3 className="font-semibold text-xs text-foreground">Crie um túnel reverso</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Utilize o <code className="text-emerald-400 bg-secondary px-1 py-0.5 rounded">cloudflared</code> ou <code className="text-emerald-400 bg-secondary px-1 py-0.5 rounded">ngrok</code> para expor a sua porta local:
                <br />
                <span className="font-mono text-[10px] text-zinc-300 block mt-1 bg-zinc-950 p-1.5 rounded">
                  cloudflared tunnel --url http://localhost:3000
                </span>
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-background space-y-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs font-mono">
                2
              </div>
              <h3 className="font-semibold text-xs text-foreground">Cadastre no Banco Dev</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Adicione a URL gerada pelo túnel na tabela <code className="text-emerald-400 font-mono text-[11px]">WebhookClientsDev</code> do PostgreSQL da API.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-background space-y-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs font-mono">
                3
              </div>
              <h3 className="font-semibold text-xs text-foreground">Fan-out Automático</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                A API passará a replicar todos os eventos recebidos da Meta para o seu túnel local de forma assíncrona e sem afetar a produção.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Event Payloads Explorer */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">
                Payloads de Eventos Repassados para Você
              </h2>
              <p className="text-xs text-muted-foreground">
                Exemplos reais das requisições POST que a sua aplicação receberá no webhook.
              </p>
            </div>
          </div>

          <Tabs defaultValue="message_received" className="w-full">
            <TabsList className="bg-card border border-border h-9">
              <TabsTrigger value="message_received" className="text-xs">
                1. Mensagem Recebida (message_received)
              </TabsTrigger>
              <TabsTrigger value="status_updated" className="text-xs">
                2. Status de Mensagem (status_updated)
              </TabsTrigger>
              <TabsTrigger value="connection_disconnected" className="text-xs">
                3. Desconexão (connection_disconnected)
              </TabsTrigger>
            </TabsList>

            {/* Event 1 */}
            <TabsContent value="message_received" className="mt-4 space-y-3">
              <div className="p-4 rounded-xl border border-border bg-card/30 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-foreground">
                    Evento: <code className="text-emerald-400">message_received</code>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Emitido quando um contato envia texto, imagem, áudio ou documento para o seu WhatsApp.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy('msg', payloadMessageReceived)}
                  className="h-8 text-xs gap-1.5"
                >
                  {copiedKey === 'msg' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  Copiar JSON
                </Button>
              </div>
              <pre className="p-4 rounded-xl font-mono text-xs bg-zinc-950 text-zinc-200 dark:bg-black overflow-x-auto border border-zinc-800">
                {payloadMessageReceived}
              </pre>
            </TabsContent>

            {/* Event 2 */}
            <TabsContent value="status_updated" className="mt-4 space-y-3">
              <div className="p-4 rounded-xl border border-border bg-card/30 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-foreground">
                    Evento: <code className="text-emerald-400">status_updated</code>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Emitido quando a mensagem muda de status na Meta (<code className="text-zinc-300">sent</code>, <code className="text-zinc-300">delivered</code>, <code className="text-zinc-300">read</code>, <code className="text-zinc-300">failed</code>).
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy('status', payloadStatusUpdated)}
                  className="h-8 text-xs gap-1.5"
                >
                  {copiedKey === 'status' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  Copiar JSON
                </Button>
              </div>
              <pre className="p-4 rounded-xl font-mono text-xs bg-zinc-950 text-zinc-200 dark:bg-black overflow-x-auto border border-zinc-800">
                {payloadStatusUpdated}
              </pre>
            </TabsContent>

            {/* Event 3 */}
            <TabsContent value="connection_disconnected" className="mt-4 space-y-3">
              <div className="p-4 rounded-xl border border-border bg-card/30 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-foreground">
                    Evento: <code className="text-emerald-400">connection_disconnected</code>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Emitido quando o número é desconectado no painel da Meta ou via API.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy('disc', payloadConnectionDisconnected)}
                  className="h-8 text-xs gap-1.5"
                >
                  {copiedKey === 'disc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  Copiar JSON
                </Button>
              </div>
              <pre className="p-4 rounded-xl font-mono text-xs bg-zinc-950 text-zinc-200 dark:bg-black overflow-x-auto border border-zinc-800">
                {payloadConnectionDisconnected}
              </pre>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
