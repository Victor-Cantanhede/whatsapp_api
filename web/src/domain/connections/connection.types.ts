import { z } from 'zod';

export interface Connection {
  id: number;
  connection_name: string;
  user_token?: string;
  waba_id: string;
  phone_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface FacebookConfig {
  appId: string;
  configId: string;
  version: string;
}

export const connectionCreateSchema = z.object({
  connection_name: z.string().min(1, 'Nome da conexão é obrigatório'),
  user_token: z.string().min(1, 'User Token da Meta é obrigatório'),
  phone_id: z.string().min(1, 'Phone ID é obrigatório'),
  waba_id: z.string().min(1, 'WABA ID é obrigatório'),
});

export const oauthCallbackSchema = z.object({
  code: z.string().min(1, 'Código de autorização é obrigatório'),
  waba_id: z.string().min(1, 'WABA ID é obrigatório'),
  connection_name: z.string().optional(),
});

export type ConnectionCreateInput = z.infer<typeof connectionCreateSchema>;
export type OauthCallbackInput = z.infer<typeof oauthCallbackSchema>;
