import {
  connectOutcomeMessage,
  parseGoogleCalendarReturn,
} from '../google-calendar.rules';

describe('parseGoogleCalendarReturn', () => {
  it('traduz os três status que o callback emite', () => {
    expect(parseGoogleCalendarReturn('soundmeet://agenda/google?status=sucesso')).toBe('connected');
    expect(parseGoogleCalendarReturn('soundmeet://agenda/google?status=cancelado')).toBe('cancelled');
    expect(parseGoogleCalendarReturn('soundmeet://agenda/google?status=erro')).toBe('failed');
  });

  it('aba fechada sem redirect (sem url) é unknown, não failed', () => {
    expect(parseGoogleCalendarReturn(null)).toBe('unknown');
    expect(parseGoogleCalendarReturn(undefined)).toBe('unknown');
    expect(parseGoogleCalendarReturn('')).toBe('unknown');
  });

  it('status desconhecido vira unknown — backend novo com app velho não vira erro falso', () => {
    expect(parseGoogleCalendarReturn('soundmeet://agenda/google?status=pendente')).toBe('unknown');
    expect(parseGoogleCalendarReturn('soundmeet://agenda/google')).toBe('unknown');
  });

  /*
   * 🔴 O `openAuthSessionAsync` só devolve URL que casa com o `returnUrl`, mas
   * a defesa não pode depender disso: se um dia a URL vier de outra porta (um
   * deep link de verdade, por exemplo), um host de terceiro NÃO pode se passar
   * por "conectado" e fazer o app afirmar ao músico que a agenda está ligada.
   */
  it('rejeita URL que não é exatamente o nosso deep link de retorno', () => {
    expect(parseGoogleCalendarReturn('soundmeet://agenda/googleX?status=sucesso')).toBe('unknown');
    expect(parseGoogleCalendarReturn('https://evil.example/agenda/google?status=sucesso')).toBe('unknown');
    expect(parseGoogleCalendarReturn('soundmeet://carteira/mercadopago?status=sucesso')).toBe('unknown');
    expect(parseGoogleCalendarReturn('soundmeet://agenda/google?status=sucesso&next=evil')).toBe('unknown');
  });

  it('só quem falhou tem mensagem — sucesso fala pelo próprio card', () => {
    expect(connectOutcomeMessage('connected')).toBeNull();
    expect(connectOutcomeMessage('unknown')).toBeNull();
    expect(connectOutcomeMessage('cancelled')).toContain('não autorizou');
    expect(connectOutcomeMessage('failed')).toContain('Não deu para conectar');
  });
});
