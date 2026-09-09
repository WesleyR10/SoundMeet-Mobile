import { ScrollView, View, Text } from 'react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { ChordTokenLine } from '@/shared/components/ChordTokenLine';
import type { ChordSheetTokenGrid, RenderableToken } from '@/shared/utils/chord-sheet';
import { PersonalChordSheetReadOnlyBody } from './PersonalChordSheetReadOnlyBody';
import type { ChordEdit } from '../../domain/personal-chord-sheet.types';

type Props = {
  grid: ChordSheetTokenGrid;
  mode: 'view' | 'edit';
  annotations?: ChordEdit[];
  onPressChord: (symbol: string) => void;
  onPressToken: (token: RenderableToken, tokenIndex: number) => void;
};

const useStyles = makeStyles((colors) => ({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.sm, paddingTop: spacing.md, paddingBottom: spacing.xxxl, gap: spacing.lg },
  section: { gap: spacing.xs },
  editHint: {
    ...typography.bodySm, color: colors.text.secondary, textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptySection: {
    ...typography.caption, color: colors.brand.primary, textTransform: 'uppercase',
    letterSpacing: 1.2, paddingHorizontal: spacing.lg,
  },
}));

export function PersonalChordSheetBody({ grid, mode, annotations, onPressChord, onPressToken }: Props) {
  const s = useStyles();
  if (mode === 'view') {
    return <PersonalChordSheetReadOnlyBody grid={grid} annotations={annotations} onPressChord={onPressChord} />;
  }

  let lineIndex = 0;
  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.editHint}>Toque em qualquer palavra para corrigir, inserir ou anotar.</Text>
      {grid.map((section, sectionIndex) => (
        <View key={sectionIndex} style={s.section}>
          {section.lines.length === 0 && section.label ? <Text style={s.emptySection}>{section.label}</Text> : null}
          {section.lines.map((line, localIndex) => {
            const index = lineIndex++;
            return (
              <ChordTokenLine
                key={`${sectionIndex}-${localIndex}`}
                label={localIndex === 0 ? section.label : undefined}
                tokens={line.tokens}
                index={index}
                state="static"
                onPressToken={onPressToken}
              />
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}
