import { View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, FileMusic, Globe2, Plus } from 'lucide-react-native';
import { spacing, radius, typography, shadows } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { EmptyState } from '@/shared/components/EmptyState';
import { SkeletonList } from '@/shared/components/Skeleton';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import type { RepertoireScreenProps } from '@/navigation/types';
import { usePersonalChordSheets } from '../../application/usePersonalChordSheets';
import type { PersonalChordSheetSummary } from '../../domain/personal-chord-sheet.types';
import { PersonalChordSheetCard } from '../components/PersonalChordSheetCard';

type Props = RepertoireScreenProps<'PersonalChordSheetList'>;

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.bg.primary },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  iconBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flex: 1, gap: 1 },
  title: { ...typography.title, color: colors.text.primary },
  subtitle: { ...typography.caption, color: colors.text.secondary },
  list: { paddingHorizontal: spacing.xl, paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  retry: { ...typography.body, fontFamily: 'Inter-SemiBold', color: colors.brand.primary },
  fab: {
    position: 'absolute', right: spacing.xl, bottom: spacing.xl, width: 56, height: 56,
    borderRadius: radius.full, backgroundColor: colors.brand.primary, alignItems: 'center',
    justifyContent: 'center', ...shadows.brand,
  },
}));

export function PersonalChordSheetListScreen({ navigation }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);
  const query = usePersonalChordSheets(musicianId, { per_page: 50, sort: 'updated_at', sort_dir: 'desc' });
  const sheets = query.data?.data ?? [];

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <AmbientGlowBackground />
      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Voltar">
          <ArrowLeft size={22} color={colors.text.primary} />
        </Pressable>
        <View style={s.titleWrap}>
          <Text style={s.title}>Minhas Cifras</Text>
          <Text style={s.subtitle}>Correções pessoais sobre a cifra da IA</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('CommunityChordSheetList')} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Comunidade de cifras">
          <Globe2 size={21} color={colors.accent.violetLight} />
        </Pressable>
      </View>

      {query.isPending ? (
        <View style={s.list}><SkeletonList count={5} itemHeight={84} /></View>
      ) : query.isError ? (
        <View style={s.center}>
          <ErrorBanner message="Não conseguimos carregar suas cifras pessoais." />
          <Pressable onPress={() => query.refetch()} accessibilityRole="button" accessibilityLabel="Tentar novamente"><Text style={s.retry}>Tentar novamente</Text></Pressable>
        </View>
      ) : sheets.length === 0 ? (
        <EmptyState
          icon={FileMusic}
          title="Sua versão, do seu jeito"
          subtitle="Crie um fork a partir do Play Mode ou escolha uma música da sua biblioteca."
          action={{ label: 'Escolher música', onPress: () => navigation.navigate('AddPersonalChordSheet') }}
        />
      ) : (
        <FlatList<PersonalChordSheetSummary>
          data={sheets}
          keyExtractor={(item) => item.personal_chord_sheet_id}
          contentContainerStyle={s.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item, index }) => (
            <PersonalChordSheetCard
              sheet={item}
              riseDelay={index * 50}
              onPress={() => navigation.navigate('PersonalChordSheetEditor', { personalChordSheetId: item.personal_chord_sheet_id })}
            />
          )}
        />
      )}

      <Pressable onPress={() => navigation.navigate('AddPersonalChordSheet')} style={s.fab} accessibilityRole="button" accessibilityLabel="Adicionar cifra pessoal">
        <Plus size={24} color={colors.text.inverse} />
      </Pressable>
    </SafeAreaView>
  );
}
