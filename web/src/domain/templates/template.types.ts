import { z } from 'zod';

export const templateComponentSchema = z.object({
  type: z.literal('BODY'),
  text: z.string().min(1, 'Texto do corpo do template é obrigatório'),
});

export const createTemplateSchema = z.object({
  connectionId: z.coerce.number({ message: 'ID da conexão é obrigatório' }).min(1, 'ID da conexão inválido'),
  name: z
    .string()
    .min(1, 'Nome do template é obrigatório')
    .regex(/^[a-z0-9_]+$/, 'O nome do template deve conter apenas letras minúsculas, números e sublinhados'),
  category: z.enum(['MARKETING', 'UTILITY']),
  components: z.array(templateComponentSchema).min(1, 'Pelo menos um componente BODY é obrigatório'),
});

export interface MetaTemplate {
  name: string;
  category: string;
  status?: string;
  id?: string;
  components?: Array<{ type: string; text?: string }>;
}

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
