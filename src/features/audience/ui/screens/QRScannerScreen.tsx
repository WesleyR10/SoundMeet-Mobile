import { useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { QrCode } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { parseQrTarget } from '@/shared/utils/qr-link';
import type { FanStackScreenProps } from '@/navigation/types';
import { useScanQr } from '../../application/useScanQr';

type Props = FanStackScreenProps<'QRScanner'>;

// O parse (e a allowlist de host) mora em `shared/utils/qr-link.ts`, testado
// isoladamente. QR de estabelecimento é lido mas ainda não tem fluxo próprio —
// ver soundmeet-backend/Docs/roadmap.md Bloco 7.15.

const useStyles = makeStyles((colors) => ({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  overlay: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    gap:                spacing.xxl,
  },
  instruction: {
    ...typography.body,
    fontFamily:      'Inter-SemiBold',
    color:           colors.text.primary,
    backgroundColor: colors.bg.overlay,
    paddingHorizontal: spacing.md,
    paddingVertical:   spacing.sm,
    borderRadius:      radius.md,
  },
  frameWrap: {
    width:          FRAME_SIZE,
    height:         FRAME_SIZE,
  },
  frame: {
    flex:           1,
    borderRadius:   radius.lg,
  },
  corner: {
    position:      'absolute',
    width:          CORNER,
    height:         CORNER,
    borderColor:   colors.brand.primary,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: radius.md },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: radius.md },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: radius.md },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: radius.md },
  errorBanner: {
    marginHorizontal: spacing.xl,
  },
  validating: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  permissionRoot: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:             spacing.md,
    paddingHorizontal: spacing.xl,
  },
  permissionTitle: {
    ...typography.title,
    color: colors.text.primary,
  },
  permissionSubtitle: {
    ...typography.body,
    color:     colors.text.secondary,
    textAlign: 'center',
  },
  permissionBtn: {
    marginTop: spacing.md,
    width:     '100%',
  },
}));

export function QRScannerScreen({ navigation }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guard síncrono: `scanned` (state) só desanexa `onBarcodeScanned` depois
  // que o React comita o re-render, e o scanner nativo pode disparar de novo
  // pro mesmo código antes disso (setScanned é assíncrono/batched) — um ref
  // é lido/escrito na hora, sem essa janela de corrida.
  const isProcessingRef = useRef(false);

  const audienceId = useAuthStore((s) => s.user?.audienceId ?? null);
  const scanQrMutation = useScanQr(audienceId);

  function scheduleReset() {
    resetTimer.current = setTimeout(() => {
      isProcessingRef.current = false;
      setScanned(false);
    }, 2000);
  }

  function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setScanned(true);
    setErrorMessage(null);

    const target = parseQrTarget(result.data);
    if (!target || target.kind !== 'musician') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setErrorMessage('Esse QR Code não é de um músico SoundMeet.');
      scheduleReset();
      return;
    }

    const musicianId = target.id;
    scanQrMutation.mutate(
      { qr_code: result.data, musician_id: musicianId },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          navigation.replace('MusicianPublicProfile', { musicianId });
        },
        onError: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setErrorMessage('Não foi possível validar esse QR Code agora.');
          scheduleReset();
        },
      },
    );
  }

  if (!permission) {
    return <SafeAreaView style={s.root} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <StatusBar style="light" />
        <View style={s.permissionRoot}>
          <QrCode size={56} color={colors.text.muted} />
          <Text style={s.permissionTitle}>Precisamos da câmera</Text>
          <Text style={s.permissionSubtitle}>Pra escanear o QR Code de um músico e descobrir o perfil dele.</Text>
          <PrimaryButton label="Permitir câmera" onPress={requestPermission} style={s.permissionBtn} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      <SafeAreaView style={s.overlay} edges={['top', 'bottom']}>
        <Text style={s.instruction}>Aponte para o QR Code do músico</Text>

        <View style={s.frameWrap}>
          <View style={s.frame}>
            <View style={[s.corner, s.cornerTL]} />
            <View style={[s.corner, s.cornerTR]} />
            <View style={[s.corner, s.cornerBL]} />
            <View style={[s.corner, s.cornerBR]} />
          </View>
        </View>

        {!!errorMessage && <ErrorBanner message={errorMessage} style={s.errorBanner} />}
        {scanQrMutation.isPending && <Text style={s.validating}>Validando...</Text>}
      </SafeAreaView>
    </View>
  );
}

const FRAME_SIZE = 240;
const CORNER = 28;
