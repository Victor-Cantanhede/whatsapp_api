'use client';

import * as React from 'react';
import { ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEnvStore } from '@/application/stores/use-env-store';
import {
  loadFacebookSdk,
  launchFacebookSignupPopup,
} from '@/infrastructure/facebook/fb-sdk';
import { FacebookConfig } from '@/domain/connections/connection.types';
import { toast } from 'sonner';

interface FbSignupCardProps {
  onAutoFillCode: (code: string, wabaId: string) => void;
}

export function FbSignupCard({ onAutoFillCode }: FbSignupCardProps) {
  const { baseUrl } = useEnvStore();
  const [config, setConfig] = React.useState<FacebookConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = React.useState(false);
  const [isOpeningPopup, setIsOpeningPopup] = React.useState(false);

  // Carrega configurações públicas da API
  const fetchConfig = React.useCallback(async () => {
    setIsLoadingConfig(true);
    try {
      const cleanBaseUrl = (baseUrl || 'http://localhost:5003').replace(/\/$/, '');
      const res = await fetch(`${cleanBaseUrl}/connection/facebook-config`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        await loadFacebookSdk();
      }
    } catch {
      // Backend offline or error
    } finally {
      setIsLoadingConfig(false);
    }
  }, [baseUrl]);

  React.useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Listener para capturar o evento de postMessage do Embedded Signup
  React.useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      if (!event.origin.endsWith('facebook.com')) return;

      try {
        const payload =
          typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        if (payload?.type === 'WA_EMBEDDED_SIGNUP') {
          const wabaId = payload.data?.waba_id;
          if (wabaId && (window as any)._tempFbCode) {
            onAutoFillCode((window as any)._tempFbCode, wabaId);
            (window as any)._tempFbCode = null;
            toast.success('Credenciais da Meta capturadas com sucesso!');
          }
        }
      } catch {
        // ignore non-json messages
      }
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [onAutoFillCode]);

  const handleLaunchSignup = () => {
    if (!config || !config.appId || !config.configId) {
      toast.error(
        'Configurações do Facebook ainda não carregadas. Verifique se o backend está ativo.'
      );
      return;
    }

    setIsOpeningPopup(true);

    launchFacebookSignupPopup(
      config,
      (code) => {
        setIsOpeningPopup(false);
        (window as any)._tempFbCode = code;
        toast.info(
          'Código retornado pelo Facebook! Aguardando evento de WABA ID...'
        );
      },
      (error) => {
        setIsOpeningPopup(false);
        toast.error(error);
      }
    );
  };

  return (
    <div className="p-4 rounded-xl border border-blue-900/40 bg-blue-950/20 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs uppercase tracking-wider">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span>Integração Embedded Signup (Login com Facebook)</span>
        </div>

        {config?.appId && (
          <span className="text-[10px] font-mono text-blue-300/80 bg-blue-900/30 px-2 py-0.5 rounded border border-blue-800/40">
            App ID: {config.appId} • {config.version}
          </span>
        )}
      </div>

      <p className="text-xs text-blue-200/90 leading-relaxed">
        Na sua aplicação de produção, o usuário se autentica através do SDK oficial da
        Meta (<code className="bg-blue-950 px-1 py-0.5 rounded text-blue-300">FB.login</code>
        ). Ao concluir o fluxo, a Meta devolve um <strong className="text-white">código de autorização (code)</strong> e o <strong className="text-white">WABA ID</strong>.
        Clique no botão abaixo para testar esse fluxo interativamente:
      </p>

      <div className="pt-1 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={handleLaunchSignup}
          disabled={isOpeningPopup || isLoadingConfig}
          className="bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium text-xs h-9 px-4 gap-2 shadow-sm"
        >
          {isOpeningPopup ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Abrindo janela da Meta...
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Simular Login com Facebook
            </>
          )}
        </Button>

        <a
          href="https://developers.facebook.com/docs/whatsapp/embedded-signup"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-300 hover:text-blue-100 flex items-center gap-1 transition-colors"
        >
          <span>Documentação Oficial da Meta</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
