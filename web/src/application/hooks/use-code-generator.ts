import { useMemo } from 'react';
import { EndpointDefinition } from '@/domain/shared/types';

interface CodeGeneratorOptions {
  endpoint: EndpointDefinition;
  baseUrl: string;
  apiKey: string;
  pathParams?: Record<string, string | number>;
  queryParams?: Record<string, string | number>;
  body?: string;
  isFormData?: boolean;
}

export function useCodeGenerator({
  endpoint,
  baseUrl,
  apiKey,
  pathParams = {},
  queryParams = {},
  body,
  isFormData,
}: CodeGeneratorOptions) {
  return useMemo(() => {
    const cleanBaseUrl = (baseUrl || 'http://localhost:5003').replace(/\/$/, '');
    let resolvedPath = endpoint.path;

    Object.entries(pathParams).forEach(([k, v]) => {
      const stringVal = encodeURIComponent(String(v ?? ''));
      resolvedPath = resolvedPath
        .replace(new RegExp(`{{${k}}}`, 'g'), stringVal)
        .replace(new RegExp(`:${k}(?=/|$)`, 'g'), stringVal);
    });

    const searchParams = new URLSearchParams();
    Object.entries(queryParams).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        searchParams.append(k, String(v));
      }
    });

    const qs = searchParams.toString();
    const fullUrl = `${cleanBaseUrl}${resolvedPath}${qs ? `?${qs}` : ''}`;

    // --- 1. cURL ---
    let curl = `curl -X ${endpoint.method} "${fullUrl}"`;
    if (apiKey) {
      curl += ` \\\n  -H "Authorization: Bearer ${apiKey}"`;
    }
    if (isFormData) {
      if (endpoint.id === 'msg-template-media') {
        curl += ` \\\n  -F "file=@/caminho/do/documento.pdf"`;
        curl += ` \\\n  -F "connectionId=1"`;
        curl += ` \\\n  -F "to=5511999999999"`;
        curl += ` \\\n  -F "templateName=fatura_mensal"`;
        curl += ` \\\n  -F "filename=Fatura_Outubro.pdf"`;
        curl += ` \\\n  -F 'variables=["João", "R$ 150,00"]'`;
      } else {
        curl += ` \\\n  -F "file=@/caminho/do/arquivo.png"`;
        curl += ` \\\n  -F "connectionId=1"`;
        curl += ` \\\n  -F "to=5511999999999"`;
        curl += ` \\\n  -F "type=image"`;
      }
    } else if (body && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      curl += ` \\\n  -H "Content-Type: application/json"`;
      curl += ` \\\n  -d '${body.replace(/\n/g, '\n  ')}'`;
    }

    // --- 2. JavaScript Fetch ---
    let jsFetch = ``;
    if (isFormData) {
      if (endpoint.id === 'msg-template-media') {
        jsFetch += `const formData = new FormData();\n`;
        jsFetch += `formData.append("file", fileInput.files[0]);\n`;
        jsFetch += `formData.append("connectionId", "1");\n`;
        jsFetch += `formData.append("to", "5511999999999");\n`;
        jsFetch += `formData.append("templateName", "fatura_mensal");\n`;
        jsFetch += `formData.append("filename", "Fatura_Outubro.pdf");\n`;
        jsFetch += `formData.append("variables", JSON.stringify(["João", "R$ 150,00"]));\n\n`;
      } else {
        jsFetch += `const formData = new FormData();\n`;
        jsFetch += `formData.append("file", fileInput.files[0]);\n`;
        jsFetch += `formData.append("connectionId", "1");\n`;
        jsFetch += `formData.append("to", "5511999999999");\n`;
        jsFetch += `formData.append("type", "image");\n\n`;
      }
    }

    jsFetch += `const response = await fetch("${fullUrl}", {\n`;
    jsFetch += `  method: "${endpoint.method}",\n`;
    jsFetch += `  headers: {\n`;
    if (apiKey) {
      jsFetch += `    "Authorization": "Bearer ${apiKey}",\n`;
    }
    if (!isFormData && body && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      jsFetch += `    "Content-Type": "application/json",\n`;
    }
    jsFetch += `  },\n`;
    if (isFormData) {
      jsFetch += `  body: formData,\n`;
    } else if (body && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      jsFetch += `  body: JSON.stringify(${body.replace(/\n/g, '\n  ')}),\n`;
    }
    jsFetch += `});\n\nconst data = await response.json();\nconsole.log(data);`;

    // --- 3. TypeScript Axios ---
    let axiosCode = `import axios from 'axios';\n\n`;
    axiosCode += `const response = await axios({\n`;
    axiosCode += `  method: '${endpoint.method.toLowerCase()}',\n`;
    axiosCode += `  url: '${fullUrl}',\n`;
    if (apiKey) {
      axiosCode += `  headers: {\n    Authorization: 'Bearer ${apiKey}',\n  },\n`;
    }
    if (isFormData) {
      axiosCode += `  data: formData, // FormData instance\n`;
    } else if (body && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      axiosCode += `  data: ${body.replace(/\n/g, '\n  ')},\n`;
    }
    axiosCode += `});\n\nconsole.log(response.data);`;

    // --- 4. Python Requests ---
    let pythonCode = `import requests\n\n`;
    pythonCode += `url = "${fullUrl}"\n`;
    pythonCode += `headers = {\n`;
    if (apiKey) {
      pythonCode += `    "Authorization": "Bearer ${apiKey}",\n`;
    }
    if (!isFormData && body && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      pythonCode += `    "Content-Type": "application/json",\n`;
    }
    pythonCode += `}\n`;
    if (isFormData) {
      if (endpoint.id === 'msg-template-media') {
        pythonCode += `files = { "file": open("fatura.pdf", "rb") }\n`;
        pythonCode += `data = {\n    "connectionId": 1,\n    "to": "5511999999999",\n    "templateName": "fatura_mensal",\n    "filename": "Fatura_Outubro.pdf",\n    "variables": '["João", "R$ 150,00"]'\n}\n\n`;
        pythonCode += `response = requests.post(url, headers=headers, files=files, data=data)\n`;
      } else {
        pythonCode += `files = { "file": open("imagem.png", "rb") }\n`;
        pythonCode += `data = { "connectionId": 1, "to": "5511999999999", "type": "image" }\n\n`;
        pythonCode += `response = requests.post(url, headers=headers, files=files, data=data)\n`;
      }
    } else if (body && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      pythonCode += `payload = ${body}\n\n`;
      pythonCode += `response = requests.${endpoint.method.toLowerCase()}(url, json=payload, headers=headers)\n`;
    } else {
      pythonCode += `\nresponse = requests.${endpoint.method.toLowerCase()}(url, headers=headers)\n`;
    }
    pythonCode += `print(response.json())`;

    return {
      curl,
      jsFetch,
      axiosCode,
      pythonCode,
      fullUrl,
    };
  }, [endpoint, baseUrl, apiKey, pathParams, queryParams, body, isFormData]);
}
