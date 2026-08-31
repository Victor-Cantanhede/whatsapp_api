import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useConnectionsStore } from '@/application/stores/use-connections-store';
import { useEnvStore } from '@/application/stores/use-env-store';
import { useHistoryStore } from '@/application/stores/use-history-store';
import * as apiClient from '@/infrastructure/api/client';

describe('Zustand Application Stores', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useEnvStore.getState().resetToDefaults();
    useHistoryStore.getState().clearHistory();
    useConnectionsStore.setState({ connections: [], isLoading: false, error: null });
  });

  describe('useEnvStore', () => {
    it('deve inicializar com valores padrão', () => {
      const state = useEnvStore.getState();
      expect(state.baseUrl).toBe('http://localhost:5003');
      expect(state.apiKey).toBe('');
      expect(state.selectedConnectionId).toBe(1);
    });

    it('deve atualizar baseUrl, apiKey e selectedConnectionId', () => {
      const { setBaseUrl, setApiKey, setSelectedConnectionId } = useEnvStore.getState();

      setBaseUrl('https://api.meudominio.com');
      setApiKey('api_key_teste_999');
      setSelectedConnectionId(42);

      const updated = useEnvStore.getState();
      expect(updated.baseUrl).toBe('https://api.meudominio.com');
      expect(updated.apiKey).toBe('api_key_teste_999');
      expect(updated.selectedConnectionId).toBe(42);
    });

    it('deve resetar o estado para os valores padrão ao chamar resetToDefaults', () => {
      const { setBaseUrl, setApiKey, setSelectedConnectionId, resetToDefaults } = useEnvStore.getState();

      setBaseUrl('https://custom.url');
      setApiKey('key');
      setSelectedConnectionId(99);

      resetToDefaults();

      const resetState = useEnvStore.getState();
      expect(resetState.baseUrl).toBe('http://localhost:5003');
      expect(resetState.apiKey).toBe('');
      expect(resetState.selectedConnectionId).toBe(1);
    });
  });

  describe('useHistoryStore', () => {
    it('deve adicionar item ao histórico gerando id e timestamp', () => {
      const { addHistoryItem } = useHistoryStore.getState();

      addHistoryItem({
        endpointId: 'msg-text',
        endpointName: 'Enviar Mensagem de Texto',
        method: 'POST',
        url: 'http://localhost:5003/messages/text',
        status: 200,
        statusText: 'OK',
        durationMs: 120,
        requestHeaders: { Authorization: 'Bearer ***' },
        requestBody: '{"to":"5511999999999"}',
        responseBody: { success: true },
        isError: false,
      });

      const history = useHistoryStore.getState().history;
      expect(history.length).toBe(1);
      expect(history[0].endpointId).toBe('msg-text');
      expect(history[0].id).toBeTruthy();
      expect(history[0].timestamp).toBeGreaterThan(0);
    });

    it('deve limitar o histórico a no máximo 30 itens', () => {
      const { addHistoryItem } = useHistoryStore.getState();

      for (let i = 1; i <= 35; i++) {
        addHistoryItem({
          endpointId: `ep-${i}`,
          endpointName: `Endpoint ${i}`,
          method: 'GET',
          url: `http://localhost:5003/test-${i}`,
          status: 200,
          statusText: 'OK',
          durationMs: 10,
          requestHeaders: {},
          isError: false,
        });
      }

      const history = useHistoryStore.getState().history;
      expect(history.length).toBe(30);
      // O item mais recente (35) deve ser o primeiro
      expect(history[0].endpointId).toBe('ep-35');
    });

    it('deve limpar todo o histórico ao invocar clearHistory', () => {
      const { addHistoryItem, clearHistory } = useHistoryStore.getState();

      addHistoryItem({
        endpointId: 'ep-1',
        endpointName: 'Endpoint 1',
        method: 'GET',
        url: 'http://localhost:5003/test',
        status: 200,
        statusText: 'OK',
        durationMs: 10,
        requestHeaders: {},
        isError: false,
      });

      expect(useHistoryStore.getState().history.length).toBe(1);

      clearHistory();
      expect(useHistoryStore.getState().history.length).toBe(0);
    });
  });

  describe('useConnectionsStore', () => {
    it('deve carregar lista de conexões e auto-selecionar o primeiro ID caso nenhum esteja selecionado', async () => {
      useEnvStore.setState({ selectedConnectionId: null });

      const mockConnections = [
        { id: 5, connection_name: 'Empresa Alfa', phone_id: '123', waba_id: '456' },
        { id: 8, connection_name: 'Empresa Beta', phone_id: '789', waba_id: '012' },
      ];

      vi.spyOn(apiClient, 'executeApiRequest').mockResolvedValue({
        url: 'http://localhost:5003/connection/getAll',
        status: 200,
        statusText: 'OK',
        durationMs: 45,
        isOk: true,
        contentType: 'application/json',
        data: {
          success: true,
          data: mockConnections,
        },
        headers: {},
      });

      await useConnectionsStore.getState().fetchConnections();

      const state = useConnectionsStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.connections).toEqual(mockConnections);

      // Auto-seleção do ID 5
      expect(useEnvStore.getState().selectedConnectionId).toBe(5);
    });

    it('deve manter o ID selecionado se ele continuar existindo na lista retornada', async () => {
      useEnvStore.setState({ selectedConnectionId: 8 });

      const mockConnections = [
        { id: 5, connection_name: 'Empresa Alfa', phone_id: '123', waba_id: '456' },
        { id: 8, connection_name: 'Empresa Beta', phone_id: '789', waba_id: '012' },
      ];

      vi.spyOn(apiClient, 'executeApiRequest').mockResolvedValue({
        url: 'http://localhost:5003/connection/getAll',
        status: 200,
        statusText: 'OK',
        durationMs: 45,
        isOk: true,
        contentType: 'application/json',
        data: mockConnections,
        headers: {},
      });

      await useConnectionsStore.getState().fetchConnections();

      expect(useEnvStore.getState().selectedConnectionId).toBe(8);
    });

    it('deve definir mensagem de erro quando a API retornar erro', async () => {
      vi.spyOn(apiClient, 'executeApiRequest').mockResolvedValue({
        url: 'http://localhost:5003/connection/getAll',
        status: 401,
        statusText: 'Unauthorized',
        durationMs: 30,
        isOk: false,
        contentType: 'application/json',
        data: {
          statusCode: 401,
          message: 'Token de autorização inválido.',
          error: 'Unauthorized',
        },
        headers: {},
      });

      await useConnectionsStore.getState().fetchConnections();

      const state = useConnectionsStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.connections).toEqual([]);
      expect(state.error).toBe('Token de autorização inválido.');
    });

    it('deve tratar exceção inesperada durante fetchConnections', async () => {
      vi.spyOn(apiClient, 'executeApiRequest').mockRejectedValue(new Error('Falha crítica de rede'));

      await useConnectionsStore.getState().fetchConnections();

      const state = useConnectionsStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.connections).toEqual([]);
      expect(state.error).toBe('Falha crítica de rede');
    });
  });
});
