import Pitchy, { type PitchyConfig, type PitchyEventCallback } from 'react-native-pitchy';

export type { PitchyConfig, PitchyEvent, PitchyEventCallback } from 'react-native-pitchy';

// Wrapper fino sobre o módulo nativo react-native-pitchy — mesma separação de
// push-registration.service.ts pro expo-notifications: mantém o import da lib
// nativa fora de application/. Pitchy captura E detecta pitch nativamente por
// conta própria (não aceita buffer externo, ver useTunerPitch.ts) — nenhum PCM
// cruza a ponte JS, só os eventos finais { pitch, confidence, volume }.
export function initPitchy(config: PitchyConfig): void {
  Pitchy.init(config);
}

export function startPitchy(): Promise<boolean> {
  return Pitchy.start();
}

export function stopPitchy(): Promise<boolean> {
  return Pitchy.stop();
}

export function subscribePitchy(callback: PitchyEventCallback) {
  return Pitchy.addListener(callback);
}
