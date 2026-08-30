import { HttpMethod } from '@/domain/shared/types';

export interface ExecuteRequestOptions {
  baseUrl: string;
  path: string;
  method: HttpMethod;
  apiKey?: string;
  pathParams?: Record<string, string | number>;
  queryParams?: Record<string, string | number>;
  body?: string;
  formData?: FormData;
}

export interface ExecuteRequestResult {
  url: string;
  status: number;
  statusText: string;
  durationMs: number;
  isOk: boolean;
  contentType: string;
  data: any;
  blobUrl?: string;
  blobSize?: number;
  headers: Record<string, string>;
  rawResponse?: string;
}

export async function executeApiRequest(
  options: ExecuteRequestOptions
): Promise<ExecuteRequestResult> {
  const {
    baseUrl,
    path,
    method,
    apiKey,
    pathParams = {},
    queryParams = {},
    body,
    formData,
  } = options;

  let cleanBaseUrl = (baseUrl || 'http://localhost:5003').replace(/\/$/, '');
  let resolvedPath = path;

  // Substitui parâmetros de rota :param ou {{param}}
  Object.entries(pathParams).forEach(([key, value]) => {
    const stringVal = encodeURIComponent(String(value ?? ''));
    resolvedPath = resolvedPath
      .replace(new RegExp(`{{${key}}}`, 'g'), stringVal)
      .replace(new RegExp(`:${key}(?=/|$)`, 'g'), stringVal);
  });

  // Anexa query parameters
  const searchParams = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const finalUrl = `${cleanBaseUrl}${resolvedPath}${queryString ? `?${queryString}` : ''}`;

  const headers: Record<string, string> = {};

  if (apiKey && apiKey.trim()) {
    headers['Authorization'] = apiKey.startsWith('Bearer ')
      ? apiKey
      : `Bearer ${apiKey.trim()}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (formData) {
    fetchOptions.body = formData;
    // Não definir Content-Type ao enviar FormData para o browser calcular o boundary
  } else if (body && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    headers['Content-Type'] = 'application/json';
    fetchOptions.body = body;
  }

  const startTime = performance.now();

  try {
    const response = await fetch(finalUrl, fetchOptions);
    const endTime = performance.now();
    const durationMs = Math.round(endTime - startTime);

    const contentType = response.headers.get('content-type') || '';
    const resHeaders: Record<string, string> = {};
    response.headers.forEach((val, key) => {
      resHeaders[key] = val;
    });

    let data: any = null;
    let blobUrl: string | undefined;
    let blobSize: number | undefined;
    let rawResponse: string | undefined;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else if (
      contentType.includes('image') ||
      contentType.includes('audio') ||
      contentType.includes('video') ||
      contentType.includes('application/pdf')
    ) {
      const blob = await response.blob();
      blobSize = blob.size;
      blobUrl = URL.createObjectURL(blob);
      data = {
        message: 'Arquivo binário recebido com sucesso',
        type: blob.type,
        sizeBytes: blob.size,
      };
    } else {
      rawResponse = await response.text();
      data = rawResponse;
    }

    return {
      url: finalUrl,
      status: response.status,
      statusText: response.statusText || (response.ok ? 'OK' : 'Error'),
      durationMs,
      isOk: response.ok,
      contentType,
      data,
      blobUrl,
      blobSize,
      headers: resHeaders,
      rawResponse,
    };
  } catch (error: any) {
    const endTime = performance.now();
    const durationMs = Math.round(endTime - startTime);

    return {
      url: finalUrl,
      status: 0,
      statusText: 'Network Error',
      durationMs,
      isOk: false,
      contentType: 'text/plain',
      data: {
        error: 'Network Error',
        message: error?.message || 'Falha de conexão com a API',
        details:
          'Verifique se a Base URL está correta, se o backend está ativo e se o CORS está liberado.',
      },
      headers: {},
      rawResponse: error?.toString(),
    };
  }
}
