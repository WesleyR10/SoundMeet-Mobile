import * as SecureStore from 'expo-secure-store';

// Preferência local do card de recap pós-show (B1): "incluir o total de
// gorjetas na imagem".
//
// Por músico, não por device: o mesmo aparelho pode ter trocado de conta, e
// preferência de exposição de RENDA é a última coisa que deveria vazar de um
// usuário para outro.
//
// `expo-secure-store` pelo mesmo motivo de wizard.storage.ts e liveSet.store.ts:
// é o que o app já tem. Trazer AsyncStorage só para isto adicionaria dependência
// NATIVA, e dependência nativa nova custa rebuild do EAS.
const keyFor = (musicianId: string) => `sm_recap_show_tips_${musicianId}`;

/**
 * 🔴 Ausência de valor é `false`, e é essa a defesa: qualquer falha de leitura
 * (chave corrompida, keychain indisponível, primeira execução) cai no lado que
 * NÃO publica a renda do músico.
 */
export async function getRecapShowTips(musicianId: string): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(keyFor(musicianId))) === '1';
  } catch {
    return false;
  }
}

export async function setRecapShowTips(
  musicianId: string,
  value: boolean,
): Promise<void> {
  try {
    if (value) {
      await SecureStore.setItemAsync(keyFor(musicianId), '1');
    } else {
      // Apagar, em vez de gravar '0': o estado padrão volta a ser a ausência de
      // chave, então "desligou" e "nunca ligou" são indistinguíveis — não fica
      // registro de que ele já considerou expor.
      await SecureStore.deleteItemAsync(keyFor(musicianId));
    }
  } catch {
    // Não conseguir lembrar a preferência não pode quebrar o compartilhamento.
    // O toggle da sessão corrente continua valendo; só não sobrevive ao próximo
    // show — falha para o lado seguro.
  }
}
