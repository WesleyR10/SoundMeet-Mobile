import { Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import * as Haptics from 'expo-haptics';

// Capacidade nativa de device (share sheet do SO, galeria) — não é adapter de
// recurso backend, então não vive em infrastructure/ (mesmo precedente de
// AvatarPicker.tsx: função assíncrona simples exportada, não um hook nem um
// "fake infra"). Reaproveitável por qualquer feature futura que precise
// compartilhar/salvar uma imagem gerada em tela (ex.: card de conquista).

export async function shareQrCardAsync(uri: string): Promise<void> {
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
    dialogTitle: 'Compartilhar QR Code',
  });
}

export async function saveQrCardToGalleryAsync(uri: string): Promise<'saved' | 'denied'> {
  // writeOnly=true: só pede permissão de adicionar à galeria (NSPhotoLibraryAddUsageDescription),
  // nunca de ler a biblioteca inteira — não precisamos disso para salvar o QR.
  const permission = await requestPermissionsAsync(true);
  if (!permission.granted) {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert('Permissão necessária', 'Precisamos salvar o QR Code na sua galeria.');
    return 'denied';
  }
  await Asset.create(uri);
  // Aqui já temos confirmação real (Asset.create não lançou) — diferente do
  // share, o "success" haptic aqui é honesto, não só "ação tomada".
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  return 'saved';
}
