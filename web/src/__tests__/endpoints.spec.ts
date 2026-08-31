import { describe, it, expect } from 'vitest';
import { API_ENDPOINTS } from '@/infrastructure/api/endpoints';
import { HttpMethod } from '@/domain/shared/types';

describe('API_ENDPOINTS Catalog Validation', () => {
  const validMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  it('deve conter todos os endpoints cadastrados com IDs únicos', () => {
    expect(API_ENDPOINTS.length).toBeGreaterThanOrEqual(13);

    const ids = API_ENDPOINTS.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('todos os endpoints devem possuir propriedades essenciais preenchidas', () => {
    API_ENDPOINTS.forEach((endpoint) => {
      expect(endpoint.id, `ID inválido no endpoint ${endpoint.name}`).toBeTruthy();
      expect(endpoint.name, `Nome vazio no endpoint ${endpoint.id}`).toBeTruthy();
      expect(endpoint.category, `Categoria vazia no endpoint ${endpoint.id}`).toBeTruthy();
      expect(validMethods).toContain(endpoint.method);
      expect(endpoint.path.startsWith('/'), `Path ${endpoint.path} deve iniciar com /`).toBe(true);
      expect(typeof endpoint.requiresAuth).toBe('boolean');
    });
  });

  it('todos os placeholders de path (ex: {{param}}) devem ter correspondência em pathParams', () => {
    API_ENDPOINTS.forEach((endpoint) => {
      const curlyMatches = endpoint.path.match(/\{\{([^}]+)\}\}/g) || [];
      const colonMatches = endpoint.path.match(/:([a-zA-Z0-9_]+)/g) || [];

      const extractedParamNames = [
        ...curlyMatches.map((m) => m.replace(/[{}]/g, '')),
        ...colonMatches.map((m) => m.replace(/^:/, '')),
      ];

      if (extractedParamNames.length > 0) {
        expect(
          endpoint.pathParams,
          `Endpoint ${endpoint.id} possui parâmetros na rota ${endpoint.path} mas não declarou pathParams`
        ).toBeDefined();

        const declaredParamNames = endpoint.pathParams!.map((p) => p.name);
        extractedParamNames.forEach((paramName) => {
          expect(
            declaredParamNames,
            `Parâmetro ${paramName} em ${endpoint.path} não está declarado nos pathParams do endpoint ${endpoint.id}`
          ).toContain(paramName);
        });
      }
    });
  });

  it('apenas o endpoint GET /connection/facebook-config deve ter requiresAuth como false', () => {
    const publicEndpoints = API_ENDPOINTS.filter((e) => !e.requiresAuth);
    expect(publicEndpoints.length).toBe(1);
    expect(publicEndpoints[0].id).toBe('conn-get-fb-config');
    expect(publicEndpoints[0].path).toBe('/connection/facebook-config');
    expect(publicEndpoints[0].method).toBe('GET');
  });

  it('endpoints com body JSON inicial devem conter JSON válido', () => {
    API_ENDPOINTS.forEach((endpoint) => {
      if (endpoint.body) {
        expect(() => JSON.parse(endpoint.body!), `Body JSON inválido no endpoint ${endpoint.id}`).not.toThrow();
      }
    });
  });

  it('o endpoint de upload de mídia msg-media deve estar configurado como FormData com campos corretos', () => {
    const mediaEndpoint = API_ENDPOINTS.find((e) => e.id === 'msg-media');
    expect(mediaEndpoint).toBeDefined();
    expect(mediaEndpoint?.isFormData).toBe(true);
    expect(mediaEndpoint?.formDataFields).toBeDefined();

    const fieldNames = mediaEndpoint?.formDataFields?.map((f) => f.name);
    expect(fieldNames).toContain('connectionId');
    expect(fieldNames).toContain('to');
    expect(fieldNames).toContain('type');
    expect(fieldNames).toContain('caption');
  });

  it('o endpoint de exclusão de template deve possuir query param templateId', () => {
    const deleteTemplateEp = API_ENDPOINTS.find((e) => e.id === 'tpl-delete');
    expect(deleteTemplateEp).toBeDefined();
    expect(deleteTemplateEp?.method).toBe('DELETE');
    expect(deleteTemplateEp?.path).toBe('/templates/{{connectionId}}');

    const queryParamNames = deleteTemplateEp?.queryParams?.map((q) => q.name);
    expect(queryParamNames).toContain('templateId');
  });
});
