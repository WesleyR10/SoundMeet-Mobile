import { z } from 'zod';

// Espelha CreateRepertoireDto/RenameRepertoireDto do backend: name string,
// obrigatório, máximo 255 (repertoire-module/dto).
export const repertoireNameSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
});

export type RepertoireNameFormValues = z.infer<typeof repertoireNameSchema>;
