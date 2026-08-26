import { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { ArrowLeft, FileText, Globe2, Plus, ChevronRight, type LucideIcon } from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows } from '@/shared/design-system/tokens';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import type { RepertoireScreenProps } from '@/navigation/types';
import { usePersonalChordSheets } from '../../application/usePersonalChordSheets';

type Props = RepertoireScreenProps<'ChordSheetsHub'>;

// Destino do card "Cifras" da Home, que antes ficava desabilitado com o rótulo
// "Em breve". Reúne os caminhos de cifra que hoje existem de verdade —
// as pessoais do músico, as compartilhadas pela comunidade e a criação de uma
// nova a partir da biblioteca.
//
// NÃO existe (ainda) um catálogo geral de cifras "do sistema": o backend
// escopa `GET /music-library/items` ao músico logado
// (music-library.controller.ts, `currentUser.userId` para não-admin), então não
// há biblioteca global para listar. Quando esse conceito existir, entra aqui
// como mais uma entrada — a tela já é um hub, não precisa de reestruturação.
export function ChordSheetsHubScreen({ navigation }: Props) {
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);
  // Mesma query key de PersonalChordSheetListScreen — cache compartilhado, sem
  // request extra; serve só para o contador do card.
  const personal = usePersonalChordSheets(musicianId, { per_page: 50, sort: 'updated_at', sort_dir: 'desc' });
  const personalCount = personal.data?.data?.length ?? null;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <AmbientGlowBackground />

      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={8}>
          <ArrowLeft size={22} color={colors.text.primary} />
        </Pressable>
        <View style={s.titleWrap}>
          <Text style={s.title}>Cifras</Text>
          <Text style={s.subtitle}>Suas versões, as da comunidade e novas cifras</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <HubCard
          delay={60}
          icon={FileText}
          accentColor={colors.brand.primary}
          title="Minhas Cifras"
          description="Suas correções sobre a cifra gerada pela IA"
          meta={personalCount === null ? null : `${personalCount} cifra${personalCount === 1 ? '' : 's'}`}
          onPress={() => navigation.navigate('PersonalChordSheetList')}
        />

        <HubCard
          delay={140}
          icon={Globe2}
          accentColor={colors.accent.violet}
          title="Comunidade"
          description="Releituras compartilhadas por outros músicos"
          onPress={() => navigation.navigate('CommunityChordSheetList')}
        />

        <HubCard
          delay={220}
          icon={Plus}
          accentColor={colors.accent.coral}
          title="Criar cifra pessoal"
          description="Escolha uma música da sua biblioteca e ajuste do seu jeito"
          onPress={() => navigation.navigate('AddPersonalChordSheet')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// Mesmo reveal em cascata hand-rolled do resto do app (HomeScreen,
// ViewProfileScreen, WalletScreen) — duplicado por tela de propósito, ver CLAUDE.md.
function useReveal(delay: number) {
  const opacity = useSharedValue(0);
  const y = useSharedValue(16);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 380 }));
    y.value = withDelay(delay, withTiming(0, { duration: 380 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }],
  }));
}

type HubCardProps = {
  delay:       number;
  icon:        LucideIcon;
  accentColor: string;
  title:       string;
  description: string;
  meta?:       string | null;
  onPress:     () => void;
};

function HubCard({ delay, icon: Icon, accentColor, title, description, meta, onPress }: HubCardProps) {
  const style = useReveal(delay);

  return (
    <Animated.View style={style}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [s.card, { borderColor: `${accentColor}40` }, pressed && s.cardPressed]}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        <View style={[s.iconBox, { backgroundColor: `${accentColor}24` }]}>
          <Icon size={20} color={accentColor} strokeWidth={2.2} />
        </View>

        <View style={s.cardBody}>
          <Text style={s.cardTitle}>{title}</Text>
          <Text style={s.cardDescription}>{description}</Text>
          {!!meta && <Text style={[s.cardMeta, { color: accentColor }]}>{meta}</Text>}
        </View>

        <ChevronRight size={20} color={colors.text.muted} />
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:                spacing.sm,
    paddingHorizontal:  spacing.xl,
    paddingVertical:    spacing.md,
  },
  iconBtn: {
    width:          44,
    height:         44,
    alignItems:     'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.xxl,
    gap:               spacing.md,
  },
  card: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:                spacing.md,
    backgroundColor:   colors.bg.surface,
    borderRadius:       radius.lg,
    borderWidth:        1,
    padding:            spacing.md,
    ...shadows.sm,
  },
  cardPressed: {
    opacity: 0.8,
  },
  iconBox: {
    width:          40,
    height:         40,
    borderRadius:   radius.md,
    alignItems:     'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap:   2,
  },
  cardTitle: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  cardDescription: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  cardMeta: {
    ...typography.caption,
    fontFamily: 'Inter-SemiBold',
    marginTop:  2,
  },
});
