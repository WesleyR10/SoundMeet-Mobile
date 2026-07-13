import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Music2, PlayCircle } from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows } from '@/shared/design-system/tokens';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { AmbientGlowBackground } from '@/shared/components/AmbientGlowBackground';
import { Pressable3DCard } from '@/shared/components/Pressable3DCard';
import { useSharedRepertoire } from '../../application/useSharedRepertoire';
import type { SharedRepertoireSong } from '../../domain/shared-repertoire.types';
import type { RootScreenProps } from '@/navigation/types';

type Props = RootScreenProps<'SharedRepertoire'>;

function formatDuration(seconds: number | null): string | null {
  if (seconds == null) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Tela raiz alcançável por deep link (soundmeet://repertoire/shared/:token),
// registrada no RootNavigator fora das tabs de músico/fã — exige login (o
// próprio RootNavigator já faz isso antes de sequer montar aqui), mas não
// exige nenhum vínculo com o dono do repertório. Somente leitura: sem
// reorder, sem editar, sem remover.
export function SharedRepertoireScreen({ navigation, route }: Props) {
  const { token } = route.params;
  const { data: repertoire, isPending, isError, refetch } = useSharedRepertoire(token);

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
          <ErrorBanner message="Esse link de repertório não é mais válido." />
          <Pressable onPress={() => refetch()} accessibilityRole="button" accessibilityLabel="Tentar novamente">
            <Text style={s.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <FlatList<SharedRepertoireSong>
        data={repertoire.songs}
        keyExtractor={(item) => item.song_id}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={
          <View style={s.headerInfo}>
            <Text style={s.subtitle}>
              {repertoire.song_count} {repertoire.song_count === 1 ? 'música' : 'músicas'}
              {repertoire.estimated_show_duration_minutes != null
                ? ` · ~${Math.round(repertoire.estimated_show_duration_minutes)} min`
                : ''}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable3DCard
            onPress={() => navigation.navigate('SharedSongViewer', { token, musicLibraryId: item.music_library_id })}
            accessibilityLabel={`Ver cifra de ${item.title}`}
          >
            <View style={s.songCard}>
              <View style={s.iconWrap}>
                <Music2 size={18} color={colors.brand.primary} />
              </View>
              <View style={s.songText}>
                <Text style={s.songTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={s.songArtist} numberOfLines={1}>
                  {item.artist}
                  {formatDuration(item.effective_duration_seconds) ? ` · ${formatDuration(item.effective_duration_seconds)}` : ''}
                </Text>
              </View>
              <PlayCircle size={22} color={colors.text.muted} />
            </View>
          </Pressable3DCard>
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
    );
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar style="light" />
      <AmbientGlowBackground />

      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={8}>
          <ArrowLeft size={22} color={colors.text.primary} />
        </Pressable>
        <Text style={s.title} numberOfLines={1}>{repertoire?.name ?? 'Repertório compartilhado'}</Text>
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
    gap:                spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.lg,
  },
  backBtn: {
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
  headerInfo: {
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom:     spacing.xxxl,
  },
  songCard: {
    flexDirection:      'row',
    alignItems:         'center',
    gap:                 spacing.md,
    backgroundColor:   colors.bg.surface,
    borderRadius:       radius.lg,
    borderWidth:         1,
    borderColor:        colors.border.default,
    paddingVertical:    spacing.md,
    paddingHorizontal:  spacing.md,
    ...shadows.sm,
  },
  iconWrap: {
    width:           36,
    height:          36,
    borderRadius:    radius.md,
    backgroundColor: colors.brand.muted,
    alignItems:      'center',
    justifyContent:  'center',
  },
  songText: {
    flex: 1,
    gap:   2,
  },
  songTitle: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  songArtist: {
    ...typography.bodySm,
    color: colors.text.secondary,
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
});
