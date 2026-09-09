import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { Skeleton, SkeletonText } from '@/shared/components/Skeleton';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useMusician } from '../../application/useMusician';
import { QRCodeContent } from '../components/QRCodeContent';
import type { ProfileScreenProps } from '@/navigation/types';

type Props = ProfileScreenProps<'QRCode'>;

// Empurrada na stack de Perfil (não é tab) — mesmo padrão de header/back de
// EditProfileScreen.tsx: sem header nativo, back button próprio. Diferente de
// EditProfileScreen/ViewProfileScreen, o back button fica visível em todo
// estado (inclusive loading/erro) — aqui não há outra forma de sair da tela
// exceto o gesto de voltar do sistema, então deixamos a affordance explícita.
const useStyles = makeStyles((colors) => ({
  // Mesmo respiro do conteúdo real — é o que evita o salto na troca.
  skeleton: { flex: 1, gap: spacing.xl, paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  // Mesmo estilo (sem chip/fundo, ícone puro sobre o AmbientGlowBackground) de
  // EditProfileScreen.tsx — único precedente de back button neste stack.
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
  loaderRoot: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    gap:              spacing.md,
    padding:          spacing.xl,
  },
  retryBtn: {
    backgroundColor:   colors.brand.primary,
    borderRadius:      radius.xl,
    paddingVertical:   spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  retryText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.inverse,
  },
}));

export function QRCodeScreen({ navigation }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);
  const { data: musician, isPending, isError, refetch } = useMusician(musicianId);

  function renderBody() {
    if (isPending) {
      return (
        <View style={s.loaderRoot}>
          <View style={s.skeleton}>
          {/* O QR é um quadrado; lista genérica mentiria a forma. */}
          <Skeleton height={260} borderRadius={radius.lg} />
          <SkeletonText lines={2} />
        </View>
        </View>
      );
    }

    if (isError || !musician) {
      return (
        <View style={s.loaderRoot}>
          <ErrorBanner message="Não conseguimos carregar seu perfil." />
          <Pressable onPress={() => refetch()} style={s.retryBtn} accessibilityRole="button" accessibilityLabel="Tentar novamente">
            <Text style={s.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }

    return <QRCodeContent musician={musician} />;
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <AmbientGlowBackground />

      <Pressable
        onPress={() => navigation.goBack()}
        style={s.backBtn}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        hitSlop={8}
      >
        <ArrowLeft size={22} color={colors.text.primary} />
      </Pressable>

      {renderBody()}
    </SafeAreaView>
  );
}
