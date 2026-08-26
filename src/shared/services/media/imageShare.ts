import { Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import * as Haptics from 'expo-haptics';

// Capacidade nativa de device (share sheet do SO, galeria) — não é adapter de
// recurso backend, então não vive em infrastructure/ (mesmo precedente de
// AvatarPicker.tsx: função assíncrona simples exportada, não um hook nem um
// "fake infra").
//
// Nasceu como `qrShare.ts`, servindo só o card de QR Code, já com a nota de que
// serviria "qualquer feature futura que precise compartilhar/salvar uma imagem
// gerada em tela". O card de recap pós-show (B1) é essa feature: em vez de
// duplicar 40 linhas de share/permissão, o módulo virou genérico e os textos
// específicos de cada card viraram parâmetro.

type ShareOptions = {
  /** Título do share sheet no Android. */
  dialogTitle?: string;
};

type SaveOptions = {
  /**
   * O que estamos pedindo permissão para salvar. Entra no alerta que o usuário
   * lê — "Precisamos salvar o QR Code" é bem mais claro que "salvar a imagem".
   */
  subject?: string;
};

export async function shareImageAsync(
  uri: string,
  options: ShareOptions = {},
): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    Alert.alert('Indisponível', 'Compartilhamento não está disponível neste dispositivo.');
    return;
  }
  // Tick tátil no toque — não dá pra confirmar "compartilhou de fato" (o SO
  // não expõe cancelamento de forma confiável entre plataformas), então o
  // feedback físico marca a ação tomada, não o resultado.
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  // Cancelar o share sheet do SO resolve a Promise normalmente — não é erro.
  await Sharing.shareAsync(uri, {
    mimeType:    'image/png', // Android
    UTI:         'public.png', // iOS
    dialogTitle: options.dialogTitle ?? 'Compartilhar',
  });
}

export async function saveImageToGalleryAsync(
  uri: string,
  options: SaveOptions = {},
): Promise<'saved' | 'denied'> {
  // writeOnly=true: só pede permissão de adicionar à galeria (NSPhotoLibraryAddUsageDescription),
  // nunca de ler a biblioteca inteira — não precisamos disso para salvar a imagem.
  const permission = await requestPermissionsAsync(true);
  if (!permission.granted) {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Permissão necessária',
      `Precisamos salvar ${options.subject ?? 'a imagem'} na sua galeria.`,
    );
    return 'denied';
  }
  await Asset.create(uri);
  // Aqui já temos confirmação real (Asset.create não lançou) — diferente do
  // share, o "success" haptic aqui é honesto, não só "ação tomada".
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  return 'saved';
}
