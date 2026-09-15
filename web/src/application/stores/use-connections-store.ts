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
        let list: Connection[] = [];
        if (Array.isArray(result.data)) {
          list = result.data as Connection[];
        } else if (
          typeof result.data === 'object' &&
          result.data !== null &&
          'data' in result.data &&
          Array.isArray((result.data as { data: unknown }).data)
        ) {
          list = (result.data as { data: Connection[] }).data;
        }

        set({ connections: list, isLoading: false });

        // Se nenhuma conexão estiver selecionada ou a selecionada não existir mais
        if (list.length > 0) {
          const exists = list.some((c: Connection) => c.id === selectedConnectionId);
          if (!exists) {
            setSelectedConnectionId(list[0].id);
          }
        }
      } else {
        const errObj =
          result.data && typeof result.data === 'object'
            ? (result.data as Record<string, unknown>)
            : null;
        set({
          connections: [],
          isLoading: false,
          error:
            typeof errObj?.message === 'string'
              ? errObj.message
              : 'Falha ao carregar conexões.',
        });
      }
    } catch (err: unknown) {
      set({
        connections: [],
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erro inesperado.',
      });
    }
  },
}));
