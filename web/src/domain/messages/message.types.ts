import { z } from 'zod';

export const sendTextMessageSchema = z.object({
  connectionId: z.coerce.number({ message: 'ID da conexão é obrigatório' }).min(1, 'ID da conexão inválido'),
  to: z.string().min(8, 'Número do destinatário com DDI (Ex: 5511999999999) é obrigatório'),
  type: z.literal('text').default('text'),
  text: z.object({
    body: z.string().min(1, 'O texto da mensagem não pode ficar vazio'),
  }),
  quotedMessageId: z.string().optional(),
});

export const sendTemplateMessageSchema = z
  .object({
    connectionId: z.coerce.number({ message: 'ID da conexão é obrigatório' }).min(1, 'ID da conexão inválido'),
    to: z.string().min(8, 'Número do destinatário com DDI é obrigatório'),
    templateName: z.string().optional(),
    templateId: z.string().optional(),
    language: z.string().default('pt_BR').optional(),
    variables: z.array(z.union([z.string(), z.number()])).optional(),
  })
  .refine((data) => Boolean(data.templateName || data.templateId), {
    message: 'Informe o templateName ou templateId do template aprovado',
    path: ['templateName'],
  });


export const sendMediaMessageSchema = z.object({
  connectionId: z.coerce.number({ message: 'ID da conexão é obrigatório' }).min(1, 'ID da conexão inválido'),
  to: z.string().min(8, 'Número do destinatário com DDI é obrigatório'),
  type: z.enum(['image', 'video', 'audio', 'document']),
  caption: z.string().optional(),
});

export type SendTextMessageInput = z.infer<typeof sendTextMessageSchema>;
export type SendTemplateMessageInput = z.infer<typeof sendTemplateMessageSchema>;
export type SendMediaMessageInput = z.infer<typeof sendMediaMessageSchema>;
