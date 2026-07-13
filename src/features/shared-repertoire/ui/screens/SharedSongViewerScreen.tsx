import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, FileX } from 'lucide-react-native';
import { colors, spacing, typography } from '@/shared/design-system/tokens';
import { ChordTokenLine } from '@/shared/components/ChordTokenLine';
import { useSharedChordSheet } from '../../application/useSharedRepertoire';
import type { RootScreenProps } from '@/navigation/types';

type Props = RootScreenProps<'SharedSongViewer'>;

// Visualizador ESTÁTICO — sem auto-scroll, sem controles de performance
// (prev/next/velocidade): esses fazem sentido pra quem está tocando ao
// vivo (Play Mode), não pra quem só está lendo/acompanhando um repertório
// de outra pessoa. Auto-scroll aqui pode virar um adicional futuro (ex.:
// fã acompanhando cantando junto), mas não faz parte deste escopo.
export function SharedSongViewerScreen({ navigation, route }: Props) {
  const { token, musicLibraryId } = route.params;
  const { data: chordSheet, grid, isPending } = useSharedChordSheet(token, musicLibraryId);

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      <View style={s.header}>
        <Pressable onPress={() => navigation.goBack()} style={s.backBtn} accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={8}>
          <ArrowLeft size={22} color={colors.text.primary} />
        </Pressable>
        <View style={s.titleWrap}>
          <Text style={s.title} numberOfLines={1}>{chordSheet?.title ?? ''}</Text>
          <Text style={s.artist} numberOfLines={1}>{chordSheet?.artist ?? ''}</Text>
        </View>
      </View>

      {isPending ? (
        <View style={s.centerRoot}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
        </View>
      ) : !grid || grid.every((section) => section.lines.length === 0) ? (
        <View style={s.centerRoot}>
          <FileX size={40} color={colors.text.muted} />
          <Text style={s.emptyTitle}>Sem cifra disponível</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {grid.flatMap((section, sectionIndex) =>
            section.lines.map((line, lineIndex) => (
              <ChordTokenLine
                key={`${sectionIndex}-${lineIndex}`}
                label={lineIndex === 0 ? section.label : undefined}
                tokens={line.tokens}
                index={lineIndex}
                state="static"
              />
            )),
          )}
        </ScrollView>
      )}
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
  titleWrap: {
    flex: 1,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  artist: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  scrollContent: {
    paddingTop:    spacing.md,
    paddingBottom: spacing.xxxl,
  },
  centerRoot: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    gap:              spacing.sm,
    padding:          spacing.xl,
  },
  emptyTitle: {
    ...typography.title,
    color:     colors.text.primary,
    textAlign: 'center',
  },
});
