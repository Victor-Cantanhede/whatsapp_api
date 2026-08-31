import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { executeApiRequest } from '@/infrastructure/api/client';

describe('executeApiRequest (HTTP Client)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('deve substituir parâmetros de rota tanto no formato {{param}} quanto no formato :param', async () => {
    const mockResponse = new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    global.fetch = fetchMock;

    await executeApiRequest({
      baseUrl: 'http://localhost:5003',
      path: '/messages/media/{{connectionId}}/:mediaId',
      method: 'GET',
      pathParams: {
        connectionId: 10,
        mediaId: 'media_123_abc',
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:5003/messages/media/10/media_123_abc',
      expect.objectContaining({
        method: 'GET',
      })
    );
  });

  it('deve codificar caracteres especiais em parâmetros de rota via encodeURIComponent', async () => {
    const mockResponse = new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    global.fetch = fetchMock;

    await executeApiRequest({
      baseUrl: 'http://localhost:5003',
      path: '/connection/{{connection_name}}',
      method: 'GET',
      pathParams: {
        connection_name: 'Empresa & Filhos / SP',
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:5003/connection/Empresa%20%26%20Filhos%20%2F%20SP',
      expect.anything()
    );
  });

  it('deve anexar query parameters corretamente ignorando valores nulos, vazios ou indefinidos', async () => {
    const mockResponse = new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    global.fetch = fetchMock;

    await executeApiRequest({
      baseUrl: 'http://localhost:5003',
      path: '/connection/getById',
      method: 'GET',
      queryParams: {
        id: 1,
        filter: '',
        ignored: null as any,
        undefinedVal: undefined as any,
        active: 'true',
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:5003/connection/getById?id=1&active=true',
      expect.anything()
    );
  });

  it('deve formatar o header Authorization adicionando Bearer se ausente', async () => {
    const mockResponse = new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    global.fetch = fetchMock;

    await executeApiRequest({
      baseUrl: 'http://localhost:5003',
      path: '/connection/getAll',
      method: 'GET',
      apiKey: 'minha_chave_secreta_123',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer minha_chave_secreta_123',
        }),
      })
    );
  });

  it('não deve duplicar o prefixo Bearer se a chave já o contiver', async () => {
    const mockResponse = new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    global.fetch = fetchMock;

    await executeApiRequest({
      baseUrl: 'http://localhost:5003',
      path: '/connection/getAll',
      method: 'GET',
      apiKey: 'Bearer chave_ja_com_bearer',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer chave_ja_com_bearer',
        }),
      })
    );
  });

  it('não deve incluir header Authorization se apiKey estiver vazia ou for indefinida', async () => {
    const mockResponse = new Response(JSON.stringify({ appId: '123' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    global.fetch = fetchMock;

    await executeApiRequest({
      baseUrl: 'http://localhost:5003',
      path: '/connection/facebook-config',
      method: 'GET',
      apiKey: '   ',
    });

    const headersPassed = fetchMock.mock.calls[0][1].headers;
    expect(headersPassed['Authorization']).toBeUndefined();
  });

  it('deve enviar Content-Type application/json e o body quando o método for POST com body JSON', async () => {
    const payload = JSON.stringify({ connectionId: 1, to: '5511999999999', text: { body: 'Teste' } });
    const mockResponse = new Response(JSON.stringify({ messaging_product: 'whatsapp' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    global.fetch = fetchMock;

    const result = await executeApiRequest({
      baseUrl: 'http://localhost:5003',
      path: '/messages/text',
      method: 'POST',
      body: payload,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:5003/messages/text',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: payload,
      })
    );
    expect(result.isOk).toBe(true);
    expect(result.status).toBe(200);
    expect(result.data).toEqual({ messaging_product: 'whatsapp' });
  });

  it('deve enviar FormData sem definir manualmente o Content-Type para preservar boundaries', async () => {
    const formData = new FormData();
    formData.append('connectionId', '1');
    formData.append('to', '5511999999999');
    formData.append('type', 'image');

    const mockResponse = new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    global.fetch = fetchMock;

    await executeApiRequest({
      baseUrl: 'http://localhost:5003',
      path: '/messages/media',
      method: 'POST',
      formData,
    });

    const passedOptions = fetchMock.mock.calls[0][1];
    expect(passedOptions.body).toBe(formData);
    expect(passedOptions.headers['Content-Type']).toBeUndefined();
  });

  it('deve processar resposta de mídia binária e gerar blobUrl', async () => {
    const fakeBlob = new Blob(['dummy audio content'], { type: 'audio/ogg' });
    const mockResponse = new Response(fakeBlob, {
      status: 200,
      headers: { 'Content-Type': 'audio/ogg' },
    });
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    // Mock URL.createObjectURL
    const createObjectURLMock = vi.fn().mockReturnValue('blob:http://localhost:3003/fake-blob-uuid');
    window.URL.createObjectURL = createObjectURLMock;

    const result = await executeApiRequest({
      baseUrl: 'http://localhost:5003',
      path: '/messages/media/1/media_ogg_123',
      method: 'GET',
    });

    expect(result.isOk).toBe(true);
    expect(result.blobUrl).toBe('blob:http://localhost:3003/fake-blob-uuid');
    expect(result.data).toEqual(
      expect.objectContaining({
        message: 'Arquivo binário recebido com sucesso',
        type: 'audio/ogg',
      })
    );
  });

  it('deve processar respostas em texto puro quando o Content-Type não for JSON nem mídia', async () => {
    const mockResponse = new Response('OK - Pong', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const result = await executeApiRequest({
      baseUrl: 'http://localhost:5003',
      path: '/health',
      method: 'GET',
    });

    expect(result.isOk).toBe(true);
    expect(result.data).toBe('OK - Pong');
    expect(result.rawResponse).toBe('OK - Pong');
  });

  it('deve capturar falhas de rede (Network Error) retornando status 0 e mensagem amigável', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

    const result = await executeApiRequest({
      baseUrl: 'http://invalid-host:9999',
      path: '/connection/getAll',
      method: 'GET',
    });

    expect(result.isOk).toBe(false);
    expect(result.status).toBe(0);
    expect(result.statusText).toBe('Network Error');
    expect(result.data).toEqual(
      expect.objectContaining({
        error: 'Network Error',
        message: 'Failed to fetch',
      })
    );
  });

  it('deve limpar trailing slash da baseUrl automaticamente', async () => {
    const mockResponse = new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    global.fetch = fetchMock;

    await executeApiRequest({
      baseUrl: 'http://localhost:5003/',
      path: '/connection/getAll',
      method: 'GET',
    });

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:5003/connection/getAll', expect.anything());
  });
});
