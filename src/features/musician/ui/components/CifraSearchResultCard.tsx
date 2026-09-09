import { View, Text } from 'react-native';
import { Music2, ChevronRight } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { Pressable3DCard } from '@/shared/components/Pressable3DCard';
import type { CifraSearchResult } from '../../domain/cifra-search.types';

type Props = {
  result:  CifraSearchResult;
  onPress: () => void;
};

const useStyles = makeStyles((colors) => ({
  wrap: {
    marginBottom: spacing.sm,
  },
  card: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:                spacing.md,
    backgroundColor:  colors.bg.surface,
    borderRadius:      radius.lg,
    borderWidth:        1,
    borderColor:       colors.border.default,
    paddingVertical:   spacing.md,
    paddingHorizontal: spacing.md,
  },
  iconWrap: {
    width:           36,
    height:          36,
    borderRadius:    radius.md,
    backgroundColor: colors.brand.muted,
    alignItems:      'center',
    justifyContent:  'center',
  },
  text: {
    flex: 1,
    gap:   2,
  },
  title: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  artist: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
}));

export function CifraSearchResultCard({ result, onPress }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable3DCard onPress={onPress} accessibilityLabel={`Selecionar ${result.title}`} style={s.wrap}>
      <View style={s.card}>
        <View style={s.iconWrap}>
          <Music2 size={18} color={colors.brand.primary} />
        </View>
        <View style={s.text}>
          <Text style={s.title} numberOfLines={1}>{result.title}</Text>
          <Text style={s.artist} numberOfLines={1}>{result.artist}</Text>
        </View>
        <ChevronRight size={18} color={colors.text.muted} />
      </View>
    </Pressable3DCard>
  );
}
