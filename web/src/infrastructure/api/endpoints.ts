import { EndpointDefinition } from '@/domain/shared/types';

export const API_ENDPOINTS: EndpointDefinition[] = [
  // 1. Conexão e Autenticação
  {
    id: 'oauth-callback',
    name: 'OAuth Callback (Embedded Signup)',
    category: '1. Autenticação & Conexão',
    method: 'POST',
    path: '/connection/oauth-callback',
    description: 'Processa o retorno do fluxo de Embedded Signup do Facebook, trocando o código de autorização por credenciais da Meta.',
    requiresAuth: true,
    isFacebookSignup: true,
    body: JSON.stringify(
      {
        code: 'AQCF-XXXXXX...',
        waba_id: '109XXXXXX',
        connection_name: 'Minha Empresa WhatsApp',
      },
      null,
      2
    ),
  },
  {
    id: 'conn-create',
    name: 'Criar Conexão Manual',
    category: '1. Autenticação & Conexão',
    method: 'POST',
    path: '/connection/create',
    description: 'Cria uma conexão manualmente inserindo credenciais de System User da Meta pré-existentes.',
    requiresAuth: true,
    body: JSON.stringify(
      {
        connection_name: 'Minha Conexão Dev',
        user_token: 'EAAG...',
        phone_id: '1234567890',
        waba_id: '0987654321',
      },
      null,
      2
    ),
  },
  {
    id: 'conn-get-all',
    name: 'Listar Todas as Conexões',
    category: '1. Autenticação & Conexão',
    method: 'GET',
    path: '/connection/getAll',
    description: 'Retorna a lista completa de conexões salvas na base de dados.',
    requiresAuth: true,
  },
  {
    id: 'conn-get-by-id',
    name: 'Buscar Conexão por ID',
    category: '1. Autenticação & Conexão',
    method: 'GET',
    path: '/connection/getById',
    description: 'Busca os dados de uma conexão específica pelo seu connectionId interno.',
    requiresAuth: true,
    queryParams: [
      {
        name: 'id',
        type: 'number',
        required: true,
        description: 'ID numérico interno gerado no banco de dados',
        placeholder: 'Ex: 1',
        default: '1',
      },
    ],
  },
  {
    id: 'conn-get-by-name',
    name: 'Buscar por Nome da Conexão',
    category: '1. Autenticação & Conexão',
    method: 'GET',
    path: '/connection/getByConnectionName',
    description: 'Busca conexão pelo nome cadastrado.',
    requiresAuth: true,
    queryParams: [
      {
        name: 'connection_name',
        type: 'text',
        required: true,
        description: 'Nome exato da conexão',
        placeholder: 'Ex: Minha Empresa',
      },
    ],
  },
  {
    id: 'conn-get-by-phone',
    name: 'Buscar por Phone ID',
    category: '1. Autenticação & Conexão',
    method: 'GET',
    path: '/connection/getByPhoneId',
    description: 'Busca conexão pelo ID do telefone na Meta.',
    requiresAuth: true,
    queryParams: [
      {
        name: 'phone_id',
        type: 'text',
        required: true,
        description: 'ID do número de telefone gerado na Meta',
        placeholder: 'Ex: 123456789',
      },
    ],
  },
  {
    id: 'conn-get-by-waba',
    name: 'Buscar por WABA ID',
    category: '1. Autenticação & Conexão',
    method: 'GET',
    path: '/connection/getByWabaId',
    description: 'Busca conexão pelo ID da conta WhatsApp Business.',
    requiresAuth: true,
    queryParams: [
      {
        name: 'waba_id',
        type: 'text',
        required: true,
        description: 'ID da conta WABA da Meta',
        placeholder: 'Ex: 10987654321',
      },
    ],
  },
  {
    id: 'conn-get-fb-config',
    name: 'Parâmetros Meta SDK (Público)',
    category: '1. Autenticação & Conexão',
    method: 'GET',
    path: '/connection/facebook-config',
    description: 'Retorna credenciais públicas para inicialização do SDK do Facebook (appId, configId, version). Não exige token de autenticação.',
    requiresAuth: false,
  },
  {
    id: 'conn-disconnect',
    name: 'Desconectar / Excluir Conexão',
    category: '1. Autenticação & Conexão',
    method: 'DELETE',
    path: '/connection/{{id}}/disconnect',
    description: 'Efetua a desconexão e remoção da conexão da base de dados local.',
    requiresAuth: true,
    pathParams: [
      {
        name: 'id',
        type: 'number',
        required: true,
        description: 'ID numérico da conexão a ser removida',
        placeholder: 'Ex: 1',
        default: '1',
      },
    ],
  },

  // 2. Envio de Mensagens
  {
    id: 'msg-text',
    name: 'Enviar Mensagem de Texto',
    category: '2. Envio de Mensagens',
    method: 'POST',
    path: '/messages/text',
    description: 'Envia uma mensagem de texto simples ou resposta citada (quoted) para um número de WhatsApp.',
    requiresAuth: true,
    body: JSON.stringify(
      {
        connectionId: 1,
        to: '5511999999999',
        type: 'text',
        text: {
          body: 'Olá! Esta é uma mensagem de teste enviada pela WhatsApp API.',
        },
      },
      null,
      2
    ),
  },
  {
    id: 'msg-template',
    name: 'Enviar Mensagem de Template',
    category: '2. Envio de Mensagens',
    method: 'POST',
    path: '/messages/template',
    description: 'Envia uma mensagem pré-aprovada (Template) pela Meta (ex: hello_world).',
    requiresAuth: true,
    body: JSON.stringify(
      {
        connectionId: 1,
        to: '5511999999999',
        templateId: 'hello_world',
      },
      null,
      2
    ),
  },
  {
    id: 'msg-media',
    name: 'Enviar Arquivo de Mídia (Upload)',
    category: '2. Envio de Mensagens',
    method: 'POST',
    path: '/messages/media',
    description: 'Envia arquivo físico (imagem, vídeo, áudio ou documento) via Multipart/Form-Data.',
    requiresAuth: true,
    isFormData: true,
    formDataFields: [
      {
        name: 'connectionId',
        type: 'number',
        required: true,
        description: 'ID interno da conexão',
        placeholder: 'Ex: 1',
        default: '1',
      },
      {
        name: 'to',
        type: 'text',
        required: true,
        description: 'Número do destinatário com DDI (Ex: 5511999999999)',
        placeholder: 'Ex: 5511999999999',
      },
      {
        name: 'type',
        type: 'select',
        required: true,
        description: 'Tipo de mídia suportada',
        default: 'image',
        options: [
          { label: 'Imagem (JPEG/PNG/WEBP)', value: 'image' },
          { label: 'Documento (PDF/DOCX/TXT)', value: 'document' },
          { label: 'Áudio (MP3/OGG/AAC)', value: 'audio' },
          { label: 'Vídeo (MP4/3GP)', value: 'video' },
        ],
      },
      {
        name: 'caption',
        type: 'text',
        required: false,
        description: 'Legenda opcional para imagens, documentos ou vídeos',
        placeholder: 'Ex: Segue o relatório solicitado em PDF',
      },
    ],
  },

  // 3. Gestão e Download de Mídias
  {
    id: 'msg-media-download',
    name: 'Download de Mídia (Stream)',
    category: '3. Gestão de Mídias',
    method: 'GET',
    path: '/messages/media/{{connectionId}}/{{mediaId}}',
    description: 'Faz streaming do arquivo binário bruto da mídia a partir da Meta usando o ID recebido via webhook.',
    requiresAuth: true,
    pathParams: [
      {
        name: 'connectionId',
        type: 'number',
        required: true,
        description: 'ID interno da conexão',
        placeholder: 'Ex: 1',
        default: '1',
      },
      {
        name: 'mediaId',
        type: 'text',
        required: true,
        description: 'ID da mídia retornado no webhook da Meta',
        placeholder: 'Ex: 873462837482',
      },
    ],
  },
  {
    id: 'msg-media-base64',
    name: 'Download de Mídia (Base64)',
    category: '3. Gestão de Mídias',
    method: 'GET',
    path: '/messages/media/{{connectionId}}/{{mediaId}}/base64',
    description: 'Retorna a mídia codificada em base64 com mimeType para renderização direta em interfaces web.',
    requiresAuth: true,
    pathParams: [
      {
        name: 'connectionId',
        type: 'number',
        required: true,
        description: 'ID interno da conexão',
        placeholder: 'Ex: 1',
        default: '1',
      },
      {
        name: 'mediaId',
        type: 'text',
        required: true,
        description: 'ID da mídia',
        placeholder: 'Ex: 873462837482',
      },
    ],
  },

  // 4. Gestão de Templates
  {
    id: 'tpl-create',
    name: 'Criar Template na Meta',
    category: '4. Gestão de Templates',
    method: 'POST',
    path: '/templates',
    description: 'Cria e submete um novo template de mensagem para aprovação da Meta.',
    requiresAuth: true,
    body: JSON.stringify(
      {
        connectionId: 1,
        name: 'aviso_promocao_semanal',
        category: 'MARKETING',
        components: [
          {
            type: 'BODY',
            text: 'Olá! Temos uma super oferta exclusiva para você esta semana.',
          },
        ],
      },
      null,
      2
    ),
  },
  {
    id: 'tpl-list',
    name: 'Listar Templates da Conta',
    category: '4. Gestão de Templates',
    method: 'GET',
    path: '/templates/{{connectionId}}',
    description: 'Lista todos os templates criados na conta WABA vinculada.',
    requiresAuth: true,
    pathParams: [
      {
        name: 'connectionId',
        type: 'number',
        required: true,
        description: 'ID da conexão vinculada ao WABA',
        placeholder: 'Ex: 1',
        default: '1',
      },
    ],
  },
  {
    id: 'tpl-delete',
    name: 'Excluir Template',
    category: '4. Gestão de Templates',
    method: 'DELETE',
    path: '/templates/{{connectionId}}',
    description: 'Remove um template de mensagem da base da Meta.',
    requiresAuth: true,
    pathParams: [
      {
        name: 'connectionId',
        type: 'number',
        required: true,
        description: 'ID interno da conexão',
        placeholder: 'Ex: 1',
        default: '1',
      },
    ],
    queryParams: [
      {
        name: 'templateId',
        type: 'text',
        required: true,
        description: 'Nome exato do template aprovado na Meta',
        placeholder: 'Ex: aviso_promocao_semanal',
      },
    ],
  },
];
