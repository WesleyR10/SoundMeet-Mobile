import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { ArrowLeft, Mic } from 'lucide-react-native';
import { colors, spacing, typography } from '@/shared/design-system/tokens';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useMusician } from '../../application/useMusician';
import { useMicrophonePermission } from '../../application/useMicrophonePermission';
import { useTunerPitch } from '../../application/useTunerPitch';
import { TunerNoteDisplay } from '../components/TunerNoteDisplay';
import { TunerCentsMeter } from '../components/TunerCentsMeter';
import { TunerNoiseFilterRow } from '../components/TunerNoiseFilterRow';
import type { ProfileScreenProps } from '@/navigation/types';

type Props = ProfileScreenProps<'Tuner'>;

// Afinador cromático (Bloco 8) — fullscreen, sem distração, mesma UX de palco
// do PlayModeScreen (fonte grande, contraste máximo, keep-awake). Cobre
// guitarra/baixo/violão/cavaquinho/banjo (ver TUNER_MIN_HZ/MAX_HZ no domain).
export function TunerScreen({ navigation }: Props) {
  useKeepAwake();

  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);
  const { data: musician } = useMusician(musicianId);

  const [permission, requestPermission] = useMicrophonePermission();
  const [noiseFilterOn, setNoiseFilterOn] = useState(false);

  // Mesmo padrão de isLocked de useEditQRCodeSection.ts — plan_tier só vem
  // populado pelo GET (useMusician), trata ausência como "não travar" pra
  // não esconder a seção por engano caso o campo demore a chegar.
  // Valores em inglês (MusicianPlanTier no backend: "free"/"essential"/"pro"),
  // não em português — bug real encontrado em revisão: "essencial" travava
  // o filtro de ruído pra sempre, mesmo pra quem paga o plano Essencial.
  const noiseFilterLocked =
    musician?.plan_tier !== undefined &&
    musician.plan_tier !== 'essential' &&
    musician.plan_tier !== 'pro';

  const micGranted = permission?.granted ?? false;
  const pitch = useTunerPitch(micGranted, noiseFilterOn && !noiseFilterLocked);

  if (!permission) {
    return <SafeAreaView style={s.root} edges={['top']} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={s.root} edges={['top']}>
        <StatusBar hidden />
        <BackButton onPress={() => navigation.goBack()} />
        <View style={s.permissionRoot}>
          <Mic size={56} color={colors.text.muted} />
          <Text style={s.permissionTitle}>Precisamos do microfone</Text>
          <Text style={s.permissionSubtitle}>
            Pra ouvir seu instrumento e detectar a afinação em tempo real.
          </Text>
          <PrimaryButton label="Permitir microfone" onPress={requestPermission} style={s.permissionBtn} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar hidden />
      <AmbientGlowBackground />
      <BackButton onPress={() => navigation.goBack()} />

      <View style={s.centerRoot}>
        <TunerCentsMeter cents={pitch.cents} hasSignal={pitch.hasSignal} />
        <TunerNoteDisplay
          note={pitch.note}
          octave={pitch.octave}
          frequencyHz={pitch.frequencyHz}
          cents={pitch.cents}
          hasSignal={pitch.hasSignal}
        />
      </View>

      <TunerNoiseFilterRow locked={noiseFilterLocked} value={noiseFilterOn} onChange={setNoiseFilterOn} />
    </SafeAreaView>
  );
}

// Mesmo estilo de QRCodeScreen.tsx/EditProfileScreen.tsx — ícone puro sobre o
// AmbientGlowBackground, sem chip/fundo.
function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={8}>
      <ArrowLeft size={22} color={colors.text.primary} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  backBtn: {
    position:       'absolute',
    top:             spacing.lg,
    left:            spacing.lg,
    width:           48,
    height:          48,
    alignItems:      'center',
    justifyContent:  'center',
    zIndex:          10,
  },
  centerRoot: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:             spacing.xxl,
  },
  permissionRoot: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    gap:                spacing.md,
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
});
