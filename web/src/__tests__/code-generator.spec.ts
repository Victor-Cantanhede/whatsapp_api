import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCodeGenerator } from '@/application/hooks/use-code-generator';
import { EndpointDefinition } from '@/domain/shared/types';

describe('useCodeGenerator Hook', () => {
  const sampleJsonEndpoint: EndpointDefinition = {
    id: 'msg-text',
    name: 'Enviar Mensagem de Texto',
    category: '2. Envio de Mensagens',
    method: 'POST',
    path: '/messages/text',
    description: 'Envia mensagem de texto',
    requiresAuth: true,
  };

  const samplePathParamEndpoint: EndpointDefinition = {
    id: 'tpl-list',
    name: 'Listar Templates',
    category: '4. Gestão de Templates',
    method: 'GET',
    path: '/templates/{{connectionId}}',
    description: 'Lista templates',
    requiresAuth: true,
  };

  const sampleFormDataEndpoint: EndpointDefinition = {
    id: 'msg-media',
    name: 'Upload Mídia',
    category: '2. Envio de Mensagens',
    method: 'POST',
    path: '/messages/media',
    description: 'Upload multipart',
    requiresAuth: true,
    isFormData: true,
  };

  it('deve gerar cURL, Fetch, Axios e Python com Authorization header e JSON body', () => {
    const body = JSON.stringify({ connectionId: 1, to: '5511999999999', text: { body: 'Olá' } });

    const { result } = renderHook(() =>
      useCodeGenerator({
        endpoint: sampleJsonEndpoint,
        baseUrl: 'http://localhost:5003',
        apiKey: 'token_123',
        body,
      })
    );

    const { curl, jsFetch, axiosCode, pythonCode, fullUrl } = result.current;

    expect(fullUrl).toBe('http://localhost:5003/messages/text');

    // cURL
    expect(curl).toContain('curl -X POST "http://localhost:5003/messages/text"');
    expect(curl).toContain('-H "Authorization: Bearer token_123"');
    expect(curl).toContain('-H "Content-Type: application/json"');

    // JS Fetch
    expect(jsFetch).toContain('fetch("http://localhost:5003/messages/text"');
    expect(jsFetch).toContain('"Authorization": "Bearer token_123"');
    expect(jsFetch).toContain('"Content-Type": "application/json"');

    // Axios
    expect(axiosCode).toContain("method: 'post'");
    expect(axiosCode).toContain("url: 'http://localhost:5003/messages/text'");
    expect(axiosCode).toContain("Authorization: 'Bearer token_123'");

    // Python
    expect(pythonCode).toContain('url = "http://localhost:5003/messages/text"');
    expect(pythonCode).toContain('"Authorization": "Bearer token_123"');
    expect(pythonCode).toContain('requests.post(url, json=payload, headers=headers)');
  });

  it('deve substituir path params e anexar query params na URL gerada', () => {
    const { result } = renderHook(() =>
      useCodeGenerator({
        endpoint: samplePathParamEndpoint,
        baseUrl: 'http://localhost:5003/',
        apiKey: 'token_xyz',
        pathParams: { connectionId: 7 },
        queryParams: { limit: 10, status: 'APPROVED' },
      })
    );

    const { fullUrl, curl } = result.current;

    expect(fullUrl).toBe('http://localhost:5003/templates/7?limit=10&status=APPROVED');
    expect(curl).toContain('http://localhost:5003/templates/7?limit=10&status=APPROVED');
  });

  it('deve omitir cabeçalho Authorization quando apiKey não for fornecida', () => {
    const { result } = renderHook(() =>
      useCodeGenerator({
        endpoint: sampleJsonEndpoint,
        baseUrl: 'http://localhost:5003',
        apiKey: '',
        body: '{}',
      })
    );

    const { curl, jsFetch, axiosCode } = result.current;

    expect(curl).not.toContain('Authorization');
    expect(jsFetch).not.toContain('Authorization');
    expect(axiosCode).not.toContain('Authorization');
  });

  it('deve gerar snippets de upload de arquivo para FormData corretamente', () => {
    const { result } = renderHook(() =>
      useCodeGenerator({
        endpoint: sampleFormDataEndpoint,
        baseUrl: 'http://localhost:5003',
        apiKey: 'media_token',
        isFormData: true,
      })
    );

    const { curl, jsFetch } = result.current;

    expect(curl).toContain('-F "file=@/caminho/do/arquivo.png"');
    expect(curl).toContain('-F "connectionId=1"');
    expect(curl).toContain('-F "type=image"');
    expect(jsFetch).toContain('body: formData');
  });
});
