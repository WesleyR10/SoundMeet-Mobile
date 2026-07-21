import { z } from 'zod';
import { parseBrDate } from '@/shared/utils/date-format';

// Bloqueio por período digitado (botão + da seção "Férias e bloqueios") —
// datas espelham AddUnavailabilityDto do backend (start_at/end_at + reason
// opcional); "data válida / não passada / fim >= início" são regras de UX
// local pra falhar antes do request.
const dateField = z
  .string()
  .min(1, 'Informe a data')
  .refine((value) => parseBrDate(value) !== null, 'Data inválida — use DD/MM/AAAA');

export const blockPeriodSchema = z
  .object({
    start_date: dateField,
    end_date:   dateField,
    reason:     z.string(),
  })
  .superRefine((values, ctx) => {
    const start = parseBrDate(values.start_date);
    const end   = parseBrDate(values.end_date);

    if (start) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (start.getTime() < today.getTime()) {
        ctx.addIssue({ code: 'custom', path: ['start_date'], message: 'A data de início já passou' });
      }
    }

    if (start && end && end.getTime() < start.getTime()) {
      ctx.addIssue({ code: 'custom', path: ['end_date'], message: 'O fim não pode ser antes do início' });
    }
  });

export type BlockPeriodFormValues = z.infer<typeof blockPeriodSchema>;
