import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';

type Props = {
  value:        string;
  onChangeText: (v: string) => void;
  onPressFilter: () => void;
  activeFilterCount?: number;
  placeholder?: string;
};

export function SearchBar({ value, onChangeText, onPressFilter, activeFilterCount = 0, placeholder }: Props) {
  return (
    <View style={s.row}>
      <View style={s.inputWrap}>
        <Search size={18} color={colors.text.muted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? 'Buscar estabelecimentos...'}
          placeholderTextColor={colors.text.muted}
          style={s.input}
          cursorColor={colors.brand.primary}
          selectionColor={`${colors.brand.primary}66`}
          autoCapitalize="none"
          accessibilityLabel="Buscar"
        />
      </View>

      <Pressable
        onPress={onPressFilter}
        style={s.filterBtn}
        accessibilityRole="button"
        accessibilityLabel="Abrir filtros"
      >
        <SlidersHorizontal size={18} color={activeFilterCount > 0 ? colors.brand.primary : colors.text.secondary} />
        {activeFilterCount > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeText}>{activeFilterCount}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:            spacing.sm,
  },
  inputWrap: {
    flex:               1,
    flexDirection:      'row',
    alignItems:         'center',
    gap:                 spacing.sm,
    height:              48,
    borderRadius:        radius.md,
    borderWidth:          1,
    borderColor:         colors.border.default,
    backgroundColor:    'rgba(255,255,255,0.04)',
    paddingHorizontal:   spacing.md,
  },
  input: {
    flex: 1,
    ...typography.body,
    fontFamily: 'Inter-Medium',
    color:      colors.text.primary,
  },
  filterBtn: {
    width:            48,
    height:           48,
    borderRadius:     radius.md,
    borderWidth:       1,
    borderColor:      colors.border.default,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  badge: {
    position:          'absolute',
    top: -4, right: -4,
    minWidth:           16,
    height:             16,
    borderRadius:       radius.full,
    backgroundColor:   colors.accent.coral,
    alignItems:        'center',
    justifyContent:    'center',
  },
  badgeText: {
    fontSize:    9,
    fontFamily:  'Inter-Bold',
    color:       colors.text.inverse,
    padding:     0,
    height:      12,
  },
});
