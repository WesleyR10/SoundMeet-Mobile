import * as SecureStore from 'expo-secure-store';

// Flag local por músico: "já viu o fim do MusicianSetupWizard (Step 5) pelo
// menos uma vez". Existe porque o gate (useMusicianWizardGate) não pode usar
// só `stage_name` como critério de conclusão — stage_name é setado no Step 2,
// mas os Steps 3 (foto) e 4 (PIX) continuam pendentes/puláveis depois disso.
// Sem essa flag, fechar o app entre o Step 2 e o Step 5 fazia o gate marcar
// o onboarding como completo e pular esses dois steps para sempre, já que
// nenhuma outra tela hoje expõe upload de avatar / troca de chave PIX.
const keyFor = (musicianId: string) => `sm_wizard_done_${musicianId}`;

export async function getWizardCompleted(musicianId: string): Promise<boolean> {
  const value = await SecureStore.getItemAsync(keyFor(musicianId));
  return value === '1';
}

export async function setWizardCompleted(musicianId: string): Promise<void> {
  await SecureStore.setItemAsync(keyFor(musicianId), '1');
}
