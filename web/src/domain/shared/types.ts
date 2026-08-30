export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ParamDefinition {
  name: string;
  type: 'text' | 'number' | 'password';
  required: boolean;
  description: string;
  placeholder?: string;
  default?: string | number;
}

export interface FormDataFieldDefinition {
  name: string;
  type: 'text' | 'number' | 'select';
  required: boolean;
  description: string;
  placeholder?: string;
  default?: string | number;
  options?: { label: string; value: string }[];
}

export interface EndpointDefinition {
  id: string;
  name: string;
  category: string;
  method: HttpMethod;
  path: string;
  description: string;
  requiresAuth: boolean;
  pathParams?: ParamDefinition[];
  queryParams?: ParamDefinition[];
  body?: string;
  isFormData?: boolean;
  formDataFields?: FormDataFieldDefinition[];
  isFacebookSignup?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  statusCode?: number;
  error?: string;
}

export interface RequestHistoryItem {
  id: string;
  endpointId: string;
  endpointName: string;
  method: HttpMethod;
  url: string;
  status: number;
  statusText: string;
  durationMs: number;
  timestamp: number;
  requestHeaders: Record<string, string>;
  requestBody?: any;
  responseBody?: any;
  isError: boolean;
}
