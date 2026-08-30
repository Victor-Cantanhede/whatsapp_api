import { FacebookConfig } from '@/domain/connections/connection.types';

declare global {
  interface Window {
    FB?: {
      init: (options: {
        appId: string;
        autoLogAppEvents?: boolean;
        xfbml?: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: {
          authResponse?: {
            code?: string;
            accessToken?: string;
            userID?: string;
            expiresIn?: number;
          };
          status?: string;
        }) => void,
        options: Record<string, any>
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

let isSdkLoading = false;
let isSdkLoaded = false;

export async function loadFacebookSdk(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (window.FB) {
    isSdkLoaded = true;
    return true;
  }

  if (isSdkLoading) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (window.FB) {
          clearInterval(checkInterval);
          isSdkLoaded = true;
          resolve(true);
        }
      }, 100);
    });
  }

  isSdkLoading = true;

  return new Promise((resolve) => {
    window.fbAsyncInit = () => {
      isSdkLoaded = true;
      isSdkLoading = false;
      resolve(true);
    };

    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if (window.FB) {
        isSdkLoaded = true;
        isSdkLoading = false;
        resolve(true);
      }
    };
    script.onerror = () => {
      isSdkLoading = false;
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export function initializeFacebookSdk(config: FacebookConfig): boolean {
  if (typeof window === 'undefined' || !window.FB) return false;

  try {
    window.FB.init({
      appId: config.appId,
      autoLogAppEvents: true,
      xfbml: true,
      version: config.version || 'v25.0',
    });
    return true;
  } catch (err) {
    console.error('Falha ao inicializar o SDK do Facebook:', err);
    return false;
  }
}

export function launchFacebookSignupPopup(
  config: FacebookConfig,
  onSuccess: (code: string) => void,
  onError: (error: string) => void
) {
  if (!window.FB) {
    onError('SDK do Facebook não carregado. Tente novamente.');
    return;
  }

  initializeFacebookSdk(config);

  window.FB.login(
    (response) => {
      if (response.authResponse && response.authResponse.code) {
        onSuccess(response.authResponse.code);
      } else {
        onError('Fluxo de login cancelado pelo usuário ou não autorizado.');
      }
    },
    {
      config_id: config.configId,
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        version: 'v3',
        setup: {
          featureType: 'whatsapp_business_app_onboarding',
        },
      },
    }
  );
}
