import { isPracticeJobSettled, stemLabel } from '../practice.types';

describe('isPracticeJobSettled', () => {
  it('para o polling em completed, failed e expired', () => {
    expect(isPracticeJobSettled('completed')).toBe(true);
    expect(isPracticeJobSettled('failed')).toBe(true);
    // `expired` é terminal e NÃO é erro: os stems venceram o prazo de retenção
    // e foram apagados. Tratá-lo como transitório manteria o app perguntando
    // para sempre por um job que nunca mais muda.
    expect(isPracticeJobSettled('expired')).toBe(true);
  });

  it('mantém o polling enquanto está na fila ou processando', () => {
    expect(isPracticeJobSettled('queued')).toBe(false);
    expect(isPracticeJobSettled('processing')).toBe(false);
  });
});

describe('stemLabel', () => {
  it('traduz os stems do htdemucs para a língua do músico', () => {
    expect(stemLabel('vocals')).toBe('Voz');
    expect(stemLabel('drums')).toBe('Bateria');
    expect(stemLabel('bass')).toBe('Baixo');
    expect(stemLabel('other')).toBe('Harmonia');
  });

  it('devolve o nome cru quando o modelo produz um stem desconhecido', () => {
    // Trocar de modelo (6 stems, piano/guitarra separados) não pode fazer a
    // mesa aparecer vazia — melhor "piano" em inglês que faixa sem nome.
    expect(stemLabel('piano')).toBe('piano');
  });
});
