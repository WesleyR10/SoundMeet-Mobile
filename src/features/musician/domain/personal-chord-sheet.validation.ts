import { z } from 'zod';

// Espelha UpdateNotesDto do backend (personal-chord-sheet-module): notas
// privadas, string|null, até 5000 chars. Sheet de campo único com botão de
// salvar externo (PersonalNotesSheet) — mesmo padrão Zod-only dos steps de
// wizard (sem react-hook-form, ver CLAUDE.md).
export const personalNotesSchema = z.string().trim().max(5000, 'Nota muito longa (máx. 5000 caracteres)');

// Espelha ChordEditDto.text do backend. Manter o mesmo teto evita rejeitar
// localmente uma anotação que a API aceita ou enviar uma que voltaria 422.
export const ANNOTATION_MAX_LENGTH = 500;
export const annotationTextSchema = z
  .string()
  .trim()
  .min(1, 'Escreva algo pra anotar')
  .max(ANNOTATION_MAX_LENGTH, `Anotação muito longa (máx. ${ANNOTATION_MAX_LENGTH} caracteres)`);

// Sanity check client-side do símbolo montado pelo ChordPickerSheet (raiz +
// qualidade + baixo opcional, ex.: "F#m7", "G/B") — não duplica o parser
// completo do backend (ChordSymbol VO), só garante que o formato básico bate
// antes de gastar uma chamada de rede; o backend segue sendo a validação de
// verdade.
export const chordSymbolSchema = z
  .string()
  .trim()
  .min(1, 'Selecione um acorde')
  .regex(/^[A-G](#|b)?[a-zA-Z0-9()]*(\/[A-G](#|b)?)?$/, 'Símbolo de acorde inválido');
