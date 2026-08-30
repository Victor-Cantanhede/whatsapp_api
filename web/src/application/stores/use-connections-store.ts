import { create } from 'zustand';
import { Connection } from '@/domain/connections/connection.types';
import { executeApiRequest } from '@/infrastructure/api/client';
import { useEnvStore } from './use-env-store';

interface ConnectionsState {
  connections: Connection[];
  isLoading: boolean;
  error: string | null;
  fetchConnections: () => Promise<void>;
}

export const useConnectionsStore = create<ConnectionsState>()((set) => ({
  connections: [],
  isLoading: false,
  error: null,
  fetchConnections: async () => {
    const { baseUrl, apiKey, selectedConnectionId, setSelectedConnectionId } =
      useEnvStore.getState();

    set({ isLoading: true, error: null });

    try {
      const result = await executeApiRequest({
        baseUrl,
        path: '/connection/getAll',
        method: 'GET',
        apiKey,
      });

      if (result.isOk && result.data) {
        const list = Array.isArray(result.data)
          ? result.data
          : result.data.data && Array.isArray(result.data.data)
          ? result.data.data
          : [];

        set({ connections: list, isLoading: false });

        // Se nenhuma conexão estiver selecionada ou a selecionada não existir mais
        if (list.length > 0) {
          const exists = list.some((c: Connection) => c.id === selectedConnectionId);
          if (!exists) {
            setSelectedConnectionId(list[0].id);
          }
        }
      } else {
        set({
          connections: [],
          isLoading: false,
          error: result.data?.message || 'Falha ao carregar conexões.',
        });
      }
    } catch (err: any) {
      set({
        connections: [],
        isLoading: false,
        error: err?.message || 'Erro inesperado.',
      });
    }
  },
}));
