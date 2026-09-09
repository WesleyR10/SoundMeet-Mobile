import { View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Plus, Mail, FileMusic } from 'lucide-react-native';
import { spacing, radius, typography, shadows } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { EmptyState } from '@/shared/components/EmptyState';
import { SkeletonList } from '@/shared/components/Skeleton';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import type { RepertoireScreenProps } from '@/navigation/types';
import { useRepertoires } from '../../application/useRepertoires';
import { RepertoireCard } from '../components/RepertoireCard';
import type { Repertoire } from '../../domain/repertoire.types';

type Props = RepertoireScreenProps<'RepertoireList'>;

// Raiz da tab "Repertório" (Bloco 7) — substitui o placeholder registrado no
// Bloco 10.1. Empurra pra CreateRepertoire/RepertoireDetail/RepertoireInvites
// via o RepertoireStackNavigator (não é a própria tab-root que navega pra
// essas telas via tab, é uma native-stack aninhada, mesmo padrão de
// ProfileStackNavigator).
const useStyles = makeStyles((colors) => ({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.lg,
  },
  title: {
    ...typography.displayMd,
    color: colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
  },
  iconBtn: {
    width:          48,
    height:         48,
    alignItems:     'center',
    justifyContent: 'center',
  },
  fab: {
    width:           48,
    height:          48,
    borderRadius:    radius.full,
    backgroundColor: colors.brand.primary,
    alignItems:      'center',
    justifyContent:  'center',
    ...shadows.brand,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.xxxl,
  },
  centerRoot: {
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

export function RepertoireListScreen({ navigation }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);
  const { data, isPending, isError, refetch } = useRepertoires(musicianId, { sort: 'created_at', sort_dir: 'desc', per_page: 50 });

  function renderBody() {
    if (isPending) {
      return (
        <View style={s.listContent}>
          <SkeletonList count={3} itemHeight={104} />
        </View>
      );
    }

    if (isError) {
      return (
        <View style={s.centerRoot}>
          <ErrorBanner message="Não conseguimos carregar seus repertórios." />
          <Pressable onPress={() => refetch()} style={s.retryBtn} accessibilityRole="button" accessibilityLabel="Tentar novamente">
            <Text style={s.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }

    const repertoires = data?.data ?? [];

    if (repertoires.length === 0) {
      return (
        <EmptyState
          icon={FileMusic}
          title="Nenhum repertório ainda"
          subtitle="Crie seu primeiro repertório pra organizar as músicas do seu show."
          action={{ label: 'Criar repertório', onPress: () => navigation.navigate('CreateRepertoire') }}
        />
      );
    }

    return (
      <FlatList<Repertoire>
        data={repertoires}
        keyExtractor={(item) => item.repertoire_id}
        contentContainerStyle={s.listContent}
        renderItem={({ item, index }) => (
          <RepertoireCard
            repertoire={item}
            riseDelay={index * 60}
            onPress={() => navigation.navigate('RepertoireDetail', { repertoireId: item.repertoire_id })}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
      />
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <AmbientGlowBackground />

      <View style={s.header}>
        <Text style={s.title}>Repertório</Text>
        <View style={s.headerActions}>
          <Pressable
            onPress={() => navigation.navigate('PersonalChordSheetList')}
            style={s.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="Minhas cifras pessoais"
            hitSlop={8}
          >
            <FileMusic size={20} color={colors.brand.primary} />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('RepertoireInvites')}
            style={s.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="Convites recebidos"
            hitSlop={8}
          >
            <Mail size={20} color={colors.text.primary} />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('CreateRepertoire')}
            style={s.fab}
            accessibilityRole="button"
            accessibilityLabel="Criar repertório"
            hitSlop={8}
          >
            <Plus size={22} color={colors.text.inverse} />
          </Pressable>
        </View>
      </View>

      {renderBody()}
    </SafeAreaView>
  );
}
