import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';
import { QRFrame } from '@/shared/components/QRFrame';
import { colors, spacing, radius, typography, shadows } from '@/shared/design-system/tokens';
import type { MusicianProfile } from '../../domain/musician.types';

const DEFAULT_CAPTION = 'Escaneie para pedir uma música';

export type QRShareCardHandle = {
  capture: () => Promise<string>;
};

type Props = {
  musician: MusicianProfile;
};

// Congela o sweep/glow do QRFrame antes de capturar: uma imagem estática com a
// faixa de brilho cortando o QR na diagonal parece um artefato quebrado, não um
// efeito — a espera de 200ms cobre o withTiming de assentamento que QRFrame.tsx
// dispara no branch active=false.
const FREEZE_SETTLE_MS = 200;

export const QRShareCard = forwardRef<QRShareCardHandle, Props>(function QRShareCard(
  { musician },
  ref,
) {
  const viewShotRef = useRef<ViewShotRef>(null);
  const [frozen, setFrozen] = useState(false);
  const logoUrl = musician.qr_customization?.logo_url;

  // Aquece o cache de imagem do RN assim que o logo aparece na tela — pela
  // hora em que o usuário toca em "Compartilhar"/"Salvar" (segundos depois),
  // a imagem já deve estar resolvida localmente. Sem isso, capturar a view
  // logo após a troca do logo corre risco de sair sem ele: `<Image>` carrega
  // de forma assíncrona e o ViewShot não espera esse load terminar.
  useEffect(() => {
    if (logoUrl) Image.prefetch(logoUrl).catch(() => undefined);
  }, [logoUrl]);

  useImperativeHandle(ref, () => ({
    capture: async () => {
      setFrozen(true);
      // Defesa extra: se o warmup do useEffect ainda não resolveu (ex.: logo
      // trocado e capturado quase imediatamente), tenta de novo — Image.prefetch
      // é idempotente/cheap quando já está em cache.
      if (logoUrl) {
        await Image.prefetch(logoUrl).catch(() => undefined);
      }
      await new Promise((resolve) => setTimeout(resolve, FREEZE_SETTLE_MS));

      if (!viewShotRef.current?.capture) {
        setFrozen(false);
        throw new Error('QR card não está pronto para captura.');
      }

      try {
        const uri = await viewShotRef.current.capture();
        return uri;
      } finally {
        setFrozen(false);
      }
    },
  }));

  const name = musician.display_name || musician.stage_name || musician.name;
  const caption = musician.qr_customization?.label || DEFAULT_CAPTION;

  return (
    <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
      <View style={s.card}>
        <QRFrame
          value={musician.qr_code!}
          active={!frozen}
          foregroundColor={musician.qr_customization?.foreground_color}
          backgroundColor={musician.qr_customization?.background_color}
          logoUrl={logoUrl}
        />
        <Text style={s.name}>{name}</Text>
        <Text style={s.caption}>{caption}</Text>
      </View>
    </ViewShot>
  );
});

const s = StyleSheet.create({
  card: {
    alignItems:      'center',
    gap:               spacing.md,
    padding:           spacing.xl,
    borderRadius:      radius.xl,
    backgroundColor: colors.bg.surface,
    ...shadows.brand,
  },
  name: {
    ...typography.title,
    color:     colors.text.primary,
    textAlign: 'center',
  },
  caption: {
    ...typography.bodySm,
    color:     colors.text.secondary,
    textAlign: 'center',
  },
});
