import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  initializeFacebookSdk,
  launchFacebookSignupPopup,
  loadFacebookSdk,
} from '@/infrastructure/facebook/fb-sdk';

describe('Facebook SDK Integration (fb-sdk.ts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete (window as any).FB;
    delete (window as any).fbAsyncInit;

    // Limpa scripts injetados
    const script = document.getElementById('facebook-jssdk');
    if (script) {
      script.remove();
    }
  });

  describe('loadFacebookSdk', () => {
    it('deve retornar true imediatamente se window.FB já estiver carregado', async () => {
      window.FB = {
        init: vi.fn(),
        login: vi.fn(),
      };

      const result = await loadFacebookSdk();
      expect(result).toBe(true);
    });

    it('deve injetar a tag script do Facebook SDK no DOM se não existir', async () => {
      const loadPromise = loadFacebookSdk();

      const scriptElement = document.getElementById('facebook-jssdk') as HTMLScriptElement;
      expect(scriptElement).not.toBeNull();
      expect(scriptElement.src).toBe('https://connect.facebook.net/en_US/sdk.js');

      // Simula inicialização pelo SDK
      window.FB = { init: vi.fn(), login: vi.fn() };
      if (window.fbAsyncInit) {
        window.fbAsyncInit();
      }

      const result = await loadPromise;
      expect(result).toBe(true);
    });
  });

  describe('initializeFacebookSdk', () => {
    it('deve retornar false se window.FB não estiver disponível', () => {
      const success = initializeFacebookSdk({
        appId: '123456',
        configId: '789012',
        version: 'v25.0',
      });
      expect(success).toBe(false);
    });

    it('deve chamar window.FB.init com os parâmetros corretos', () => {
      const initMock = vi.fn();
      window.FB = {
        init: initMock,
        login: vi.fn(),
      };

      const success = initializeFacebookSdk({
        appId: '1603368927865789',
        configId: '1640381240764034',
        version: 'v25.0',
      });

      expect(success).toBe(true);
      expect(initMock).toHaveBeenCalledWith({
        appId: '1603368927865789',
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v25.0',
      });
    });
  });

  describe('launchFacebookSignupPopup', () => {
    it('deve disparar onError se window.FB não estiver disponível', () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();

      launchFacebookSignupPopup(
        { appId: '123', configId: '456', version: 'v25.0' },
        onSuccess,
        onError
      );

      expect(onError).toHaveBeenCalledWith('SDK do Facebook não carregado. Tente novamente.');
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('deve chamar FB.login com extras e acionar onSuccess ao receber auth code', () => {
      const initMock = vi.fn();
      const loginMock = vi.fn().mockImplementation((callback, options) => {
        callback({
          authResponse: {
            code: 'AUTH_CODE_META_XYZ',
          },
          status: 'connected',
        });
      });

      window.FB = {
        init: initMock,
        login: loginMock,
      };

      const onSuccess = vi.fn();
      const onError = vi.fn();

      launchFacebookSignupPopup(
        { appId: '1603368927865789', configId: '1640381240764034', version: 'v25.0' },
        onSuccess,
        onError
      );

      expect(loginMock).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          config_id: '1640381240764034',
          response_type: 'code',
          override_default_response_type: true,
          extras: {
            version: 'v3',
            setup: {
              featureType: 'whatsapp_business_app_onboarding',
            },
          },
        })
      );
      expect(onSuccess).toHaveBeenCalledWith('AUTH_CODE_META_XYZ');
      expect(onError).not.toHaveBeenCalled();
    });

    it('deve acionar onError quando o usuário fechar o popup sem autorizar', () => {
      window.FB = {
        init: vi.fn(),
        login: vi.fn().mockImplementation((callback) => {
          callback({
            status: 'unknown',
          });
        }),
      };

      const onSuccess = vi.fn();
      const onError = vi.fn();

      launchFacebookSignupPopup(
        { appId: '123', configId: '456', version: 'v25.0' },
        onSuccess,
        onError
      );

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith('Fluxo de login cancelado pelo usuário ou não autorizado.');
    });
  });
});
