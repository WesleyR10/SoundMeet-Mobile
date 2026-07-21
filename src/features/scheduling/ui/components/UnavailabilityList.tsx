import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Palmtree, Trash2 } from 'lucide-react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import type { Unavailability } from '../../domain/availability.types';

type Props = {
  unavailabilities: Unavailability[];
  onRemove:         (blockId: string) => void;
  isRemoving:       boolean;
};

function formatRange(startISO: string, endISO: string): string {
  const start = new Date(startISO);
  const end   = new Date(endISO);
  const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const sameDay = start.toDateString() === end.toDateString();
  return sameDay ? fmt(start) : `${fmt(start)} → ${fmt(end)}`;
}

// Lista de férias/bloqueios da agenda (item 9, jul/2026) — cada linha com
// período, motivo opcional e remoção direta (DELETE blocks/:id).
export function UnavailabilityList({ unavailabilities, onRemove, isRemoving }: Props) {
  if (unavailabilities.length === 0) {
    return (
      <Text style={s.empty}>
        Nenhum bloqueio — toque num dia do calendário pra marcar férias ou indisponibilidade.
      </Text>
    );
  }

  return (
    <View style={s.list}>
      {unavailabilities.map((block) => (
        <View key={block.id} style={s.row}>
          <View style={s.iconBox}>
            <Palmtree size={16} color={colors.accent.coral} />
          </View>
          <View style={s.info}>
            <Text style={s.range}>{formatRange(block.start_at, block.end_at)}</Text>
            {!!block.reason && <Text style={s.reason} numberOfLines={1}>{block.reason}</Text>}
          </View>
          <Pressable
            onPress={() => onRemove(block.id)}
            disabled={isRemoving}
            hitSlop={8}
            style={s.removeBtn}
            accessibilityRole="button"
            accessibilityLabel="Remover bloqueio"
          >
            <Trash2 size={18} color={isRemoving ? colors.text.muted : colors.status.error} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  empty: {
    ...typography.bodySm,
    color: colors.text.muted,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:                spacing.md,
    padding:            spacing.md,
    borderRadius:       radius.md,
    borderWidth:         1,
    borderColor:        colors.border.default,
    backgroundColor:    'rgba(255,255,255,0.03)',
  },
  iconBox: {
    width:           32,
    height:          32,
    borderRadius:    radius.sm,
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,107,107,0.10)',
  },
  info: {
    flex: 1,
  },
  range: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.primary,
  },
  reason: {
    ...typography.bodySm,
    color: colors.text.secondary,
  },
  removeBtn: {
    width:           40,
    height:          40,
    alignItems:      'center',
    justifyContent:  'center',
  },
});
