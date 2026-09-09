import { View, Text, Pressable } from 'react-native';
import { Music2 } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import type { SongRequestSuggestion } from '../../domain/request.types';

type Props = {
  suggestions: SongRequestSuggestion[];
  onSelect:    (suggestion: SongRequestSuggestion) => void;
};

// Sugestões por popularidade (histórico de pedidos), não catálogo de
// repertório — gap real, ver soundmeet-backend/Docs/roadmap.md Bloco 7.14.
const useStyles = makeStyles((colors) => ({
  wrap: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:            spacing.sm,
  },
  chip: {
    flexDirection:      'row',
    alignItems:         'center',
    gap:                 spacing.xs,
    borderRadius:        radius.full,
    borderWidth:          1,
    borderColor:         colors.border.brand,
    backgroundColor:     colors.brand.muted,
    paddingHorizontal:   spacing.md,
    // minHeight 48 — tamanho mínimo de toque (CLAUDE.md); sem hitSlop porque
    // os chips ficam colados num flex-wrap (gap curto), hitSlop entre
    // vizinhos sobreporia as áreas de toque.
    minHeight:           48,
    maxWidth:            220,
  },
  chipText: {
    ...typography.caption,
    fontFamily: 'Inter-Medium',
    color:      colors.text.primary,
  },
}));

export function SongSuggestionChips({ suggestions, onSelect }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  if (suggestions.length === 0) return null;

  return (
    <View style={s.wrap}>
      {suggestions.map((suggestion, index) => (
        <Pressable
          key={`${suggestion.song_title}-${index}`}
          onPress={() => onSelect(suggestion)}
          style={s.chip}
          accessibilityRole="button"
          accessibilityLabel={`Usar sugestão ${suggestion.song_title}`}
        >
          <Music2 size={13} color={colors.brand.primary} />
          <Text style={s.chipText} numberOfLines={1}>
            {suggestion.song_title}{suggestion.artist ? ` · ${suggestion.artist}` : ''}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
