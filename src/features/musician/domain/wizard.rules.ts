/**
 * Regras do assistente de cadastro do músico (MusicianSetupWizard) — puras.
 */
export type WizardStep = 1 | 2 | 3 | 4 | 5;

export type WizardGateInput = {
  hasStageName:         boolean;
  /** Marca local: este aparelho já viu o passo 5 (os passos 3 e 4 são puláveis). */
  completedOnThisDevice: boolean;
  hasAvatar:            boolean;
  hasPixKey:            boolean;
};

export type WizardGateDecision =
  | { kind: 'complete' }
  | { kind: 'needs-wizard'; resumeStep: WizardStep };

/*
 * 🔴 O que o SERVIDOR já sabe conta como concluído. Antes, depois do nome
 * artístico, só a marca local decidia: quem já tinha foto e PIX cadastrados
 * (outro aparelho, reinstalação, o seed) caía de novo no assistente, no passo
 * da foto, para refazer o que já estava feito.
 *
 * A marca local continua valendo para quem PULOU foto/PIX de propósito neste
 * aparelho — pular não deixa rastro no servidor. Num aparelho novo essa pessoa
 * revê os dois passos, que são puláveis; é o custo aceitável.
 *
 * Retoma no primeiro passo que realmente falta, não sempre na foto.
 */
export function resolveWizardGate(input: WizardGateInput): WizardGateDecision {
  if (!input.hasStageName) return { kind: 'needs-wizard', resumeStep: 1 };
  if (input.completedOnThisDevice) return { kind: 'complete' };
  if (input.hasAvatar && input.hasPixKey) return { kind: 'complete' };
  return { kind: 'needs-wizard', resumeStep: input.hasAvatar ? 4 : 3 };
}

/*
 * Voltar é sempre permitido (para qualquer passo já passado); avançar só pelo
 * "Continuar", que valida e salva. Voltar ao nome/estilo depois de salvos é
 * seguro: o "Continuar" do passo 2 faz o PATCH de novo, e ele é idempotente.
 */
export function canJumpBackTo(target: WizardStep, current: WizardStep): boolean {
  return target < current;
}

export function previousStep(step: WizardStep): WizardStep | null {
  return step > 1 ? ((step - 1) as WizardStep) : null;
}
