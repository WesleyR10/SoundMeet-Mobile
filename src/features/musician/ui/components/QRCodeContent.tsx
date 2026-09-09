import { useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { QrCode as QrCodeIcon } from 'lucide-react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { useQRCardShare } from '../../application/useQRCardShare';
import { QRShareCard, type QRShareCardHandle } from './QRShareCard';
import { QRActionRow } from './QRActionRow';
import type { MusicianProfile } from '../../domain/musician.types';

type Props = {
  musician: MusicianProfile;
};

// Extraído de QRCodeScreen.tsx (limite de ~200 linhas/screen) — o "conteúdo
// carregado": choreography de entrada + card + ações. Fica isolado do gate de
// loading/erro/back button, que mora na screen.
const useStyles = makeStyles((colors) => ({
  content: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    gap:                spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...typography.displayMd,
    color:     colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color:             colors.text.secondary,
    textAlign:         'center',
    marginTop:         spacing.sm,
    paddingHorizontal: spacing.md,
  },
  errorBanner: {
    alignSelf: 'stretch',
  },
  actionsRow: {
    flexDirection: 'row',
    gap:            spacing.md,
    alignSelf:      'stretch',
  },
  emptyState: {
    alignItems: 'center',
    gap:         spacing.md,
    padding:     spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color:     colors.text.secondary,
    textAlign: 'center',
    maxWidth:  260,
  },
}));

export function QRCodeContent({ musician }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const cardRef = useRef<QRShareCardHandle>(null);
  const { shareCard, isSharing, justShared, saveCard, isSaving, justSaved, bannerError } = useQRCardShare(cardRef);

  const titleOpacity   = useSharedValue(0);
  const titleY         = useSharedValue(12);
  const cardOpacity    = useSharedValue(0);
  const cardScale      = useSharedValue(0.92);
  const actionsOpacity = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: 260 });
    titleY.value        = withTiming(0, { duration: 260 });

    cardOpacity.value = withDelay(120, withTiming(1, { duration: 300 }));
    cardScale.value    = withDelay(120, withSpring(1, { damping: 9, stiffness: 120 }));

    actionsOpacity.value = withDelay(500, withTiming(1, { duration: 300 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity:   titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity:   cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));
  const actionsStyle = useAnimatedStyle(() => ({
    opacity: actionsOpacity.value,
  }));

  return (
    <View style={s.content}>
      <Animated.View style={titleStyle}>
        <Text style={s.title}>Seu QR Code</Text>
        <Text style={s.subtitle}>Mostre, cole ou compartilhe — é assim que o público te encontra.</Text>
      </Animated.View>

      {musician.qr_code ? (
        <>
          <Animated.View style={cardStyle}>
            <QRShareCard ref={cardRef} musician={musician} />
          </Animated.View>

          {bannerError && <ErrorBanner message={bannerError} style={s.errorBanner} />}

          <Animated.View style={[s.actionsRow, actionsStyle]}>
            <QRActionRow
              onShare={shareCard}
              onSave={saveCard}
              isSharing={isSharing}
              isSaving={isSaving}
              justShared={justShared}
              justSaved={justSaved}
            />
          </Animated.View>
        </>
      ) : (
        <View style={s.emptyState}>
          <QrCodeIcon size={64} color={colors.text.muted} />
          <Text style={s.emptyText}>Seu QR Code ainda não foi gerado. Tente novamente em instantes.</Text>
        </View>
      )}
    </View>
  );
}
