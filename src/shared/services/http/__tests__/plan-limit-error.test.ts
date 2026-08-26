import { isPlanLimitError } from '../types';

// Função pura — o nível de teste que este projeto pratica (ver CLAUDE.md).
// Existe porque a AnalyticsScreen precisa distinguir "seu plano não cobre isso"
// de "deu ruim, tenta de novo": desde o gate 9.7a, o músico FREE recebe 402 em
// GET /musicians/:id/analytics, e oferecer "tentar novamente" nesse caso manda
// ele repetir para sempre uma ação que nunca vai passar.

function axiosErrorWithStatus(status: number) {
  return {
    isAxiosError: true,
    response: { status, data: { statusCode: status, message: 'Faça upgrade.' } },
  };
}

describe('isPlanLimitError', () => {
  it('reconhece 402 (PlanLimitExceededError do core)', () => {
    expect(isPlanLimitError(axiosErrorWithStatus(402))).toBe(true);
  });

  it('não confunde com 403 — ownership negado não é falta de plano', () => {
    expect(isPlanLimitError(axiosErrorWithStatus(403))).toBe(false);
  });

  it('não confunde com 422, 404 nem 500', () => {
    expect(isPlanLimitError(axiosErrorWithStatus(422))).toBe(false);
    expect(isPlanLimitError(axiosErrorWithStatus(404))).toBe(false);
    expect(isPlanLimitError(axiosErrorWithStatus(500))).toBe(false);
  });

  it('erro sem resposta (rede caiu) não é limite de plano', () => {
    expect(isPlanLimitError({ isAxiosError: true })).toBe(false);
  });

  it('valores que não são erro de API', () => {
    expect(isPlanLimitError(new Error('boom'))).toBe(false);
    expect(isPlanLimitError(null)).toBe(false);
    expect(isPlanLimitError(undefined)).toBe(false);
  });
});
