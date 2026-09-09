import { View, Text } from 'react-native';
import { ChevronRight, Music2 } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { Pressable3DCard } from '@/shared/components/Pressable3DCard';
import type { MusicLibraryItem } from '../../domain/music-library.types';

type Props = {
  item: MusicLibraryItem;
  onPress: () => void;
  disabled?: boolean;
};

const useStyles = makeStyles((colors) => ({
  card: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.bg.surface,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  disabled: { opacity: 0.5 },
  icon: {
    width: 40, height: 40, borderRadius: radius.md, alignItems: 'center',
    justifyContent: 'center', backgroundColor: colors.brand.muted,
  },
  text: { flex: 1, gap: 2 },
  title: { ...typography.body, fontFamily: 'Inter-SemiBold', color: colors.text.primary },
  artist: { ...typography.bodySm, color: colors.text.secondary },
  unavailable: { ...typography.caption, color: colors.status.warning },
}));

export function MusicLibraryItemPickerCard({ item, onPress, disabled = false }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable3DCard onPress={onPress} disabled={disabled} accessibilityLabel={`Criar cifra pessoal de ${item.title}`}>
      <View style={[s.card, disabled && s.disabled]}>
        <View style={s.icon}>
          <Music2 size={18} color={item.has_chord_sheet ? colors.brand.primary : colors.text.muted} />
        </View>
        <View style={s.text}>
          <Text style={s.title} numberOfLines={1}>{item.title}</Text>
          <Text style={s.artist} numberOfLines={1}>{item.artist}</Text>
          {!item.has_chord_sheet && <Text style={s.unavailable}>A cifra da IA ainda não está pronta</Text>}
        </View>
        <ChevronRight size={18} color={colors.text.muted} />
      </View>
    </Pressable3DCard>
  );
}
