import { ScrollView, View, Text } from 'react-native';
import { MessageSquare } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { ChordTokenLine } from '@/shared/components/ChordTokenLine';
import type { ChordSheetTokenGrid } from '@/shared/utils/chord-sheet';
import type { ChordEdit } from '../../domain/personal-chord-sheet.types';

type Props = {
  grid: ChordSheetTokenGrid;
  annotations?: ChordEdit[];
  onPressChord: (symbol: string) => void;
};

const useStyles = makeStyles((colors) => ({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.sm, paddingTop: spacing.md, paddingBottom: spacing.xxxl, gap: spacing.lg },
  section: { gap: spacing.xs },
  emptySection: {
    ...typography.caption, color: colors.brand.primary, textTransform: 'uppercase',
    letterSpacing: 1.2, paddingHorizontal: spacing.lg,
  },
  annotation: {
    marginHorizontal: spacing.lg, marginTop: spacing.xs, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border.brand, backgroundColor: colors.brand.muted,
    padding: spacing.sm, gap: spacing.sm, flexDirection: 'row', alignItems: 'flex-start',
  },
  annotationText: { ...typography.bodySm, color: colors.text.primary, flex: 1 },
}));

export function PersonalChordSheetReadOnlyBody({ grid, annotations = [], onPressChord }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  let lineIndex = 0;
  const publicNotes = annotations.filter((edit) => edit.type === 'annotate' && edit.text);
  const annotationsByTime = new Map<number, ChordEdit[]>();
  publicNotes.forEach((edit) => {
    const current = annotationsByTime.get(edit.at_ms) ?? [];
    current.push(edit);
    annotationsByTime.set(edit.at_ms, current);
  });

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {grid.map((section, sectionIndex) => (
        <View key={sectionIndex} style={s.section}>
          {section.lines.length === 0 && section.label ? <Text style={s.emptySection}>{section.label}</Text> : null}
          {section.lines.map((line, localIndex) => {
            const index = lineIndex++;
            const lineAnnotations = line.tokens.flatMap((token) =>
              token.startMs == null ? [] : annotationsByTime.get(token.startMs) ?? [],
            );
            return (
              <View key={`${sectionIndex}-${localIndex}`}>
                <ChordTokenLine
                  label={localIndex === 0 ? section.label : undefined}
                  tokens={line.tokens}
                  index={index}
                  state="static"
                  onPressChord={onPressChord}
                />
                {lineAnnotations.map((edit) => (
                  <View key={edit.edit_id} style={s.annotation}>
                    <MessageSquare size={14} color={colors.brand.primary} />
                    <Text style={s.annotationText}>{edit.text}</Text>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}
