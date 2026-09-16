import { z } from 'zod';

export const templateComponentSchema = z.object({
  type: z.enum(['BODY', 'HEADER', 'FOOTER']),
  format: z.enum(['DOCUMENT', 'TEXT', 'IMAGE', 'VIDEO']).optional(),
  text: z.string().optional(),
  example: z.union([z.array(z.string()), z.record(z.string(), z.unknown())]).optional(),
});

export const createTemplateSchema = z.object({
  connectionId: z.coerce.number({ message: 'ID da conexão é obrigatório' }).min(1, 'ID da conexão inválido'),
  name: z
    .string()
    .min(1, 'Nome do template é obrigatório')
    .regex(/^[a-z0-9_]+$/, 'O nome do template deve conter apenas letras minúsculas, números e sublinhados'),
  category: z.enum(['MARKETING', 'UTILITY']),
  language: z.string().default('pt_BR').optional(),
  components: z.array(templateComponentSchema).min(1, 'Pelo menos um componente é obrigatório'),
});


export interface MetaTemplate {
  name: string;
  category: string;
  status?: string;
  id?: string;
  components?: Array<{ type: string; format?: string; text?: string }>;
}

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
