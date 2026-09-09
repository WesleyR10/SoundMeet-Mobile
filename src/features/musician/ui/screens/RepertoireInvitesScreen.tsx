import { View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Mail } from 'lucide-react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { EmptyState } from '@/shared/components/EmptyState';
import { SkeletonList } from '@/shared/components/Skeleton';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useRepertoireInvites } from '../../application/useRepertoireInvites';
import { RepertoireCard } from '../components/RepertoireCard';
import type { Repertoire } from '../../domain/repertoire.types';
import type { RepertoireScreenProps } from '@/navigation/types';

type Props = RepertoireScreenProps<'RepertoireInvites'>;

// "Convites recebidos" — repertórios de OUTROS músicos onde fui convidado
// nominalmente (colaboração PRO). Tocar abre em modo leitura (mesma
// RepertoireDetailScreen, que já esconde ações de dono quando is_owner=false
// via ausência de share_token/invitees na resposta pro não-dono).
const useStyles = makeStyles((colors) => ({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:                spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.lg,
  },
  backBtn: {
    width:          48,
    height:         48,
    alignItems:     'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
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
  retryText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.brand.primary,
  },
}));

export function RepertoireInvitesScreen({ navigation }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);
  const { data: invites, isPending, isError, refetch } = useRepertoireInvites(musicianId);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <AmbientGlowBackground />

      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={8}>
          <ArrowLeft size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={s.title}>Convites recebidos</Text>
      </View>

      {isPending ? (
        <View style={s.listContent}><SkeletonList count={3} itemHeight={104} /></View>
      ) : isError ? (
        <View style={s.centerRoot}>
          <ErrorBanner message="Não conseguimos carregar seus convites." />
          <Pressable onPress={() => refetch()} accessibilityRole="button" accessibilityLabel="Tentar novamente">
            <Text style={s.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (invites ?? []).length === 0 ? (
        <EmptyState
          icon={Mail}
          title="Nenhum convite por enquanto"
          subtitle="Quando outro músico te convidar para um repertório compartilhado, o convite aparece aqui."
        />
      ) : (
        <FlatList<Repertoire>
          data={invites}
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
      )}
    </SafeAreaView>
  );
}
