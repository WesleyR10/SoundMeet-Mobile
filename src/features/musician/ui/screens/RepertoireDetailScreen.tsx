import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Settings, Plus } from 'lucide-react-native';
import DraggableFlatList, { type DragEndParams } from 'react-native-draggable-flatlist';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { useRepertoire } from '../../application/useRepertoire';
import { useReorderSongs, useRemoveSong } from '../../application/useRepertoireMutations';
import { SongCard } from '../components/SongCard';
import type { RepertoireSong } from '../../domain/repertoire.types';
import type { RepertoireScreenProps } from '@/navigation/types';

type Props = RepertoireScreenProps<'RepertoireDetail'>;

// Lista de músicas do repertório com reorder por arraste
// (react-native-draggable-flatlist, decisão confirmada com o usuário — Bloco
// 7). Reorder é otimista (useReorderSongs já atualiza o cache local antes da
// resposta do servidor), então o drag-solto não "pisca" de volta.
export function RepertoireDetailScreen({ navigation, route }: Props) {
  const { repertoireId } = route.params;
  const musicianId = useAuthStore((s) => s.user?.musicianId ?? null);
  const { data: repertoire, isPending, isError, refetch } = useRepertoire(musicianId, repertoireId);

  const reorderMutation = useReorderSongs(musicianId, repertoireId);
  const removeMutation = useRemoveSong(musicianId, repertoireId);

  const isOwner = repertoire ? repertoire.musician_id === musicianId : false;

  function onDragEnd({ data }: DragEndParams<RepertoireSong>) {
    reorderMutation.mutate(data.map((s) => s.song_id));
  }

  function renderBody() {
    if (isPending) {
      return (
        <View style={s.centerRoot}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
        </View>
      );
    }

    if (isError || !repertoire) {
      return (
        <View style={s.centerRoot}>
          <ErrorBanner message="Não conseguimos carregar esse repertório." />
          <Pressable onPress={() => refetch()} accessibilityRole="button" accessibilityLabel="Tentar novamente">
            <Text style={s.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }

    if (repertoire.songs.length === 0) {
      return (
        <View style={s.centerRoot}>
          <Text style={s.emptyTitle}>Nenhuma música ainda</Text>
          <Text style={s.emptySubtitle}>Adicione uma cifra pra começar a montar seu show.</Text>
        </View>
      );
    }

    return (
      <DraggableFlatList<RepertoireSong>
        data={repertoire.songs}
        keyExtractor={(item) => item.song_id}
        containerStyle={s.listContainer}
        contentContainerStyle={s.listContent}
        onDragEnd={isOwner ? onDragEnd : undefined}
        renderItem={({ item, getIndex, drag, isActive }) => (
          <SongCard
            song={item}
            index={getIndex() ?? item.position - 1}
            isActive={isActive}
            drag={isOwner ? drag : () => undefined}
            onRemove={() => isOwner && removeMutation.mutate(item.song_id)}
            onPress={() =>
              navigation.navigate('PlayMode', { repertoireId, musicLibraryId: item.music_library_id })
            }
            onPractice={() =>
              navigation.navigate('PracticeMode', { repertoireId, musicLibraryId: item.music_library_id })
            }
          />
        )}
      />
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <AmbientGlowBackground />

      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} style={s.headerBtn} accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={8}>
          <ArrowLeft size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={s.title} numberOfLines={1}>{repertoire?.name ?? ''}</Text>
        {isOwner && (
          <View style={s.headerActions}>
            <Pressable
              onPress={() => navigation.navigate('CifraSearch', { repertoireId })}
              style={s.headerBtn}
              accessibilityRole="button"
              accessibilityLabel="Adicionar música"
              hitSlop={8}
            >
              <Plus size={22} color={colors.brand.primary} />
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('EditRepertoire', { repertoireId })}
              style={s.headerBtn}
              accessibilityRole="button"
              accessibilityLabel="Gerenciar repertório"
              hitSlop={8}
            >
              <Settings size={20} color={colors.text.primary} />
            </Pressable>
          </View>
        )}
      </View>

      {renderBody()}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:                spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.lg,
  },
  headerBtn: {
    width:          44,
    height:         44,
    alignItems:     'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
    flex:   1,
  },
  headerActions: {
    flexDirection: 'row',
  },
  listContainer: {
    flex: 1,
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
  emptyTitle: {
    ...typography.title,
    color:     colors.text.primary,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    color:     colors.text.secondary,
    textAlign: 'center',
  },
  retryText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.brand.primary,
  },
});
