import { Alert, Linking } from 'react-native';

import {
  resolveExternalUrl,
  type ExternalUrlBlockReason,
  type ExternalUrlVerdict,
} from '@/shared/utils/external-url';

/**
 * SM-025 — único ponto do app que entrega URL de terceiro ao sistema
 * operacional.
 *
 * `Linking.openURL` não é uma navegação: é um `Intent` no Android e um
 * `openURL:` no iOS, ou seja, entrega a string para qualquer app instalado que
 * tenha declarado o esquema. Por isso a decisão de abrir nunca é do componente
 * — ele passa o veredito de `external-url.ts` e este módulo executa.
 *
 * Os três desfechos são deliberadamente diferentes:
 *
 * - `trusted`   → abre direto. O host está na allowlist do contexto.
 * - `unverified` → **confirma nomeando o host**. É a única defesa possível
 *   contra um destino que é sintaticamente válido mas que o app não tem como
 *   avalizar; esconder o host aqui seria repetir o defeito original, em que o
 *   rótulo ("IG") dizia uma coisa e o destino era outra.
 * - `blocked`   → não abre, e diz por quê. Falhar em silêncio faria o músico
 *   achar que o próprio link está certo e que o app é que está quebrado.
 */

const BLOCK_MESSAGE: Record<ExternalUrlBlockReason, string> = {
  empty:             'Este link está vazio.',
  unsafe_characters: 'Este link tem caracteres inválidos e não pode ser aberto com segurança.',
  not_https:         'Só abrimos links https. Este endereço usa outro tipo de link.',
  has_userinfo:      'Este link tenta esconder o destino real e foi bloqueado.',
  invalid_host:      'O endereço deste link não é um site válido.',
};

async function open(url: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Não foi possível abrir', 'Nenhum app disponível para abrir este link.');
  }
}

export async function openExternalUrl(verdict: ExternalUrlVerdict): Promise<void> {
  if (verdict.status === 'blocked') {
    Alert.alert('Link bloqueado', BLOCK_MESSAGE[verdict.reason]);
    return;
  }

  if (verdict.status === 'trusted') {
    await open(verdict.url);
    return;
  }

  Alert.alert(
    'Sair do SoundMeet?',
    `Este link abre ${verdict.host}, que não é um endereço conhecido. Só continue se você confia nele.`,
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Abrir mesmo assim', onPress: () => void open(verdict.url) },
    ],
  );
}

/** Atalho para URL que não pertence a nenhuma rede conhecida (ex.: PDF de cardápio). */
export function openExternalHref(
  raw: string | null | undefined,
  allowedDomains: readonly string[] = [],
): Promise<void> {
  return openExternalUrl(resolveExternalUrl(raw, allowedDomains));
}
