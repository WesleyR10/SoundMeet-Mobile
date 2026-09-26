import { canJumpBackTo, previousStep, resolveWizardGate } from '../wizard.rules';

const base = { hasStageName: true, completedOnThisDevice: false, hasAvatar: false, hasPixKey: false };

describe('resolveWizardGate', () => {
  it('sem nome artístico, começa do início', () => {
    expect(resolveWizardGate({ ...base, hasStageName: false, hasAvatar: true, hasPixKey: true }))
      .toEqual({ kind: 'needs-wizard', resumeStep: 1 });
  });

  it('foto e PIX já no servidor contam como concluído, mesmo sem a marca local', () => {
    // O caso relatado: músico do seed / outro aparelho caía de novo no assistente.
    expect(resolveWizardGate({ ...base, hasAvatar: true, hasPixKey: true })).toEqual({ kind: 'complete' });
  });

  it('a marca local vale para quem pulou foto/PIX neste aparelho', () => {
    expect(resolveWizardGate({ ...base, completedOnThisDevice: true })).toEqual({ kind: 'complete' });
  });

  it('retoma no primeiro passo que falta', () => {
    expect(resolveWizardGate(base)).toEqual({ kind: 'needs-wizard', resumeStep: 3 });
    expect(resolveWizardGate({ ...base, hasAvatar: true })).toEqual({ kind: 'needs-wizard', resumeStep: 4 });
  });
});

describe('navegação entre passos', () => {
  it('volta para qualquer passo anterior, nunca avança pulando', () => {
    expect(canJumpBackTo(2, 4)).toBe(true);
    expect(canJumpBackTo(4, 4)).toBe(false);
    expect(canJumpBackTo(5, 3)).toBe(false);
  });

  it('o passo 1 não tem anterior', () => {
    expect(previousStep(1)).toBeNull();
    expect(previousStep(3)).toBe(2);
  });
});
