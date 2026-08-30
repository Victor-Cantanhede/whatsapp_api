import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface EnvState {
  baseUrl: string;
  apiKey: string;
  selectedConnectionId: number | null;
  setBaseUrl: (url: string) => void;
  setApiKey: (key: string) => void;
  setSelectedConnectionId: (id: number | null) => void;
  resetToDefaults: () => void;
}

export const useEnvStore = create<EnvState>()(
  persist(
    (set) => ({
      baseUrl: 'http://localhost:5003',
      apiKey: '',
      selectedConnectionId: 1,
      setBaseUrl: (baseUrl) => set({ baseUrl }),
      setApiKey: (apiKey) => set({ apiKey }),
      setSelectedConnectionId: (selectedConnectionId) =>
        set({ selectedConnectionId }),
      resetToDefaults: () =>
        set({
          baseUrl: 'http://localhost:5003',
          apiKey: '',
          selectedConnectionId: 1,
        }),
    }),
    {
      name: 'whatsapp_api_env_store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
