'use client';

import * as React from 'react';
import { Send } from 'lucide-react';
import { Header } from '@/presentation/components/layout/header';
import { EnvBar } from '@/presentation/components/layout/env-bar';
import { Sidebar } from '@/presentation/components/layout/sidebar';
import { EndpointHeader } from '@/presentation/components/tester/endpoint-header';
import { DynamicForm } from '@/presentation/components/tester/dynamic-form';
import { JsonEditor } from '@/presentation/components/tester/json-editor';
import { FormDataMedia } from '@/presentation/components/tester/form-data-media';
import { FormDataTemplateMedia } from '@/presentation/components/tester/form-data-template-media';
import { FbSignupCard } from '@/presentation/components/tester/fb-signup-card';
import { ResponsePanel } from '@/presentation/components/tester/response-panel';
import { CodeSnippets } from '@/presentation/components/tester/code-snippets';
import { HistorySheet } from '@/presentation/components/tester/history-sheet';
import { ChatPreview } from '@/presentation/components/whatsapp/chat-preview';
import { Button } from '@/components/ui/button';
import { API_ENDPOINTS } from '@/infrastructure/api/endpoints';
import {
  ExecuteRequestResult,
  executeApiRequest,
} from '@/infrastructure/api/client';
import { useEnvStore } from '@/application/stores/use-env-store';
import { useHistoryStore } from '@/application/stores/use-history-store';
import { EndpointDefinition, RequestHistoryItem } from '@/domain/shared/types';
import { toast } from 'sonner';

function computeInitialParams(
  endpoint: EndpointDefinition,
  selectedConnectionId: number | null
) {
  const initialPath: Record<string, string | number> = {};
  endpoint.pathParams?.forEach((p) => {
    if (p.name === 'connectionId' && selectedConnectionId) {
      initialPath[p.name] = selectedConnectionId;
    } else if (p.name === 'id' && selectedConnectionId) {
      initialPath[p.name] = selectedConnectionId;
    } else {
      initialPath[p.name] = p.default ?? '';
    }
  });

  const initialQuery: Record<string, string | number> = {};
  endpoint.queryParams?.forEach((q) => {
    initialQuery[q.name] = q.default ?? '';
  });

  let initialBody = endpoint.body || '';
  if (endpoint.body) {
    try {
      const parsed = JSON.parse(endpoint.body);
      if ('connectionId' in parsed && selectedConnectionId) {
        parsed.connectionId = selectedConnectionId;
      }
      initialBody = JSON.stringify(parsed, null, 2);
    } catch {
      initialBody = endpoint.body;
    }
  }

  return { initialPath, initialQuery, initialBody };
}

export default function ApiTesterPage() {
  const { baseUrl, apiKey, selectedConnectionId } = useEnvStore();
  const { addHistoryItem } = useHistoryStore();

  const [selectedEndpoint, setSelectedEndpoint] =
    React.useState<EndpointDefinition>(API_ENDPOINTS[0]);
  const [prevEndpointId, setPrevEndpointId] = React.useState(API_ENDPOINTS[0].id);
  const [prevConnId, setPrevConnId] = React.useState<number | null>(null);

  const [pathParams, setPathParams] = React.useState<
    Record<string, string | number>
  >(() => computeInitialParams(API_ENDPOINTS[0], selectedConnectionId).initialPath);
  const [queryParams, setQueryParams] = React.useState<
    Record<string, string | number>
  >(() => computeInitialParams(API_ENDPOINTS[0], selectedConnectionId).initialQuery);
  const [body, setBody] = React.useState<string>(
    () => computeInitialParams(API_ENDPOINTS[0], selectedConnectionId).initialBody
  );
  const [hasJsonError, setHasJsonError] = React.useState(false);
  const [formData, setFormData] = React.useState<FormData | null>(null);
  const [isFormDataValid, setIsFormDataValid] = React.useState(false);

  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<ExecuteRequestResult | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);

  // Ajusta parâmetros ao alternar endpoint ou conexão durante o render
  if (
    selectedEndpoint.id !== prevEndpointId ||
    selectedConnectionId !== prevConnId
  ) {
    setPrevEndpointId(selectedEndpoint.id);
    setPrevConnId(selectedConnectionId);

    const { initialPath, initialQuery, initialBody } = computeInitialParams(
      selectedEndpoint,
      selectedConnectionId
    );
    setPathParams(initialPath);
    setQueryParams(initialQuery);
    setBody(initialBody);
    setResult(null);
    setHasJsonError(false);
  }

  const handlePathParamChange = (name: string, value: string | number) => {
    setPathParams((prev) => ({ ...prev, [name]: value }));
  };

  const handleQueryParamChange = (name: string, value: string | number) => {
    setQueryParams((prev) => ({ ...prev, [name]: value }));
  };

  // Preenchimento automático ao receber código da Meta
  const handleAutoFillFbCode = (code: string, wabaId: string) => {
    const json = JSON.stringify(
      {
        code,
        waba_id: wabaId,
        connection_name: 'Conexão WhatsApp Meta',
      },
      null,
      2
    );
    setBody(json);
  };

  // Extrai texto e destinatário para o preview do chat
  const chatPreviewData = React.useMemo(() => {
    if (selectedEndpoint.id === 'msg-text') {
      try {
        const parsed = JSON.parse(body);
        return {
          text: parsed?.text?.body,
          recipient: parsed?.to,
        };
      } catch {
        return {};
      }
    }
    if (selectedEndpoint.id === 'msg-template') {
      try {
        const parsed = JSON.parse(body);
        return {
          templateName: parsed?.templateName || parsed?.templateId,
          recipient: parsed?.to,
          variables: Array.isArray(parsed?.variables) ? parsed.variables : undefined,
          documentName:
            parsed?.document?.filename ||
            (parsed?.document?.url || parsed?.document?.base64 ? 'documento.pdf' : undefined),
        };
      } catch {
        return {};
      }
    }
    if (selectedEndpoint.id === 'msg-template-media') {
      const to = formData?.get('to') as string;
      const templateName = formData?.get('templateName') as string;
      const filename = formData?.get('filename') as string;
      const file = formData?.get('file') as File;
      const rawVars = formData?.get('variables') as string;
      let variables: any[] | undefined;
      if (rawVars) {
        try {
          variables = JSON.parse(rawVars);
        } catch {
          variables = [rawVars];
        }
      }
      return {
        templateName,
        recipient: to,
        variables,
        documentName: filename || file?.name || 'documento.pdf',
      };
    }
    return null;
  }, [selectedEndpoint.id, body, formData]);

  // Disparo da Requisição HTTP
  const handleSendRequest = async () => {
    if (hasJsonError) {
      toast.error('Corrija o erro de sintaxe no JSON antes de disparar.');
      return;
    }

    if (selectedEndpoint.isFormData && !isFormDataValid) {
      toast.error('Selecione um arquivo e preencha os campos obrigatórios.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await executeApiRequest({
        baseUrl,
        apiKey,
        path: selectedEndpoint.path,
        method: selectedEndpoint.method,
        pathParams,
        queryParams,
        body: selectedEndpoint.isFormData ? undefined : body,
        formData: selectedEndpoint.isFormData ? formData || undefined : undefined,
      });

      setResult(res);

      // Adiciona ao histórico
      addHistoryItem({
        endpointId: selectedEndpoint.id,
        endpointName: selectedEndpoint.name,
        method: selectedEndpoint.method,
        url: res.url,
        status: res.status,
        statusText: res.statusText,
        durationMs: res.durationMs,
        requestHeaders: apiKey ? { Authorization: 'Bearer ***' } : {},
        requestBody: selectedEndpoint.isFormData ? '[FormData]' : body,
        responseBody: res.data,
        isError: !res.isOk,
      });

      if (res.isOk) {
        toast.success(`Requisição concluída com status ${res.status} OK (${res.durationMs}ms)`);
      } else {
        toast.error(`Falha na requisição: ${res.status || 'Erro de Rede'}`);
      }
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error
          ? err.message
          : 'Erro inesperado ao disparar requisição.';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistoryItem = (item: RequestHistoryItem) => {
    const ep = API_ENDPOINTS.find((e) => e.id === item.endpointId);
    if (ep) {
      setSelectedEndpoint(ep);
      if (item.requestBody && typeof item.requestBody === 'string' && item.requestBody !== '[FormData]') {
        setBody(item.requestBody);
      }
      toast.info(`Configurações de "${item.endpointName}" carregadas.`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-emerald-500 selection:text-white">
      <Header onOpenHistory={() => setIsHistoryOpen(true)} />
      <EnvBar />

      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          endpoints={API_ENDPOINTS}
          selectedEndpoint={selectedEndpoint}
          onSelectEndpoint={(ep) => setSelectedEndpoint(ep)}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-background/50">
          {/* Endpoint Details Header */}
          <EndpointHeader endpoint={selectedEndpoint} />

          {/* Interactive Workspace Grid */}
          <div className="p-4 md:p-6 space-y-6 max-w-7xl w-full mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Left Column: Request Configuration */}
              <div className="xl:col-span-7 space-y-5">
                {/* Meta Embedded Signup Card if applicable */}
                {selectedEndpoint.isFacebookSignup && (
                  <FbSignupCard onAutoFillCode={handleAutoFillFbCode} />
                )}

                {/* Path Params Form */}
                {selectedEndpoint.pathParams && selectedEndpoint.pathParams.length > 0 && (
                  <DynamicForm
                    title="Parâmetros de Rota (Path Parameters)"
                    params={selectedEndpoint.pathParams}
                    values={pathParams}
                    onChange={handlePathParamChange}
                    prefixSymbol=":"
                  />
                )}

                {/* Query Params Form */}
                {selectedEndpoint.queryParams && selectedEndpoint.queryParams.length > 0 && (
                  <DynamicForm
                    title="Parâmetros de Busca (Query Parameters)"
                    params={selectedEndpoint.queryParams}
                    values={queryParams}
                    onChange={handleQueryParamChange}
                    prefixSymbol="?"
                  />
                )}

                {/* FormData Upload for Media or Template Media */}
                {selectedEndpoint.isFormData ? (
                  selectedEndpoint.id === 'msg-template-media' ? (
                    <FormDataTemplateMedia
                      onFormDataChange={(fd, valid) => {
                        setFormData(fd);
                        setIsFormDataValid(valid);
                      }}
                    />
                  ) : (
                    <FormDataMedia
                      onFormDataChange={(fd, valid) => {
                        setFormData(fd);
                        setIsFormDataValid(valid);
                      }}
                    />
                  )
                ) : (
                  /* JSON Body Editor */
                  ['POST', 'PUT', 'PATCH'].includes(selectedEndpoint.method) && (
                    <JsonEditor
                      value={body}
                      onChange={setBody}
                      onErrorChange={setHasJsonError}
                    />
                  )
                )}

                {/* WhatsApp Chat Preview if Sending Message */}
                {chatPreviewData && (
                  <ChatPreview
                    text={chatPreviewData.text}
                    recipient={chatPreviewData.recipient}
                    templateName={chatPreviewData.templateName}
                    variables={chatPreviewData.variables}
                    documentName={chatPreviewData.documentName}
                  />
                )}

                {/* Action Trigger Button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    onClick={handleSendRequest}
                    disabled={isLoading || hasJsonError}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-10 px-6 gap-2 rounded-xl shadow-md hover:shadow-emerald-500/10 transition-all cursor-pointer"
                  >
                    <Send className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>
                      {isLoading ? 'Disparando Requisição...' : 'Disparar Requisição'}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Right Column: Response Console */}
              <div className="xl:col-span-5 flex flex-col">
                <ResponsePanel result={result} isLoading={isLoading} />
              </div>
            </div>

            {/* Code Generator & Snippets Section */}
            <div className="pt-2">
              <CodeSnippets
                endpoint={selectedEndpoint}
                baseUrl={baseUrl}
                apiKey={apiKey}
                pathParams={pathParams}
                queryParams={queryParams}
                body={body}
                isFormData={selectedEndpoint.isFormData}
              />
            </div>
          </div>
        </main>
      </div>

      {/* History Sheet Drawer */}
      <HistorySheet
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        onSelectHistoryItem={handleSelectHistoryItem}
      />
    </div>
  );
}
