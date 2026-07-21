import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { WEEKDAY_LABELS_SHORT } from '../../domain/availability.types';

export type DayMarkers = {
  hasBooking: boolean;
  hasBlock:   boolean;
};

type Props = {
  year:  number;
  month: number; // 1-12
  /** Marcadores por dia do mês (chave = dia 1..31). */
  markers:        ReadonlyMap<number, DayMarkers>;
  /** Range em seleção (modo "adicionar bloqueio") — dias do mês ou null. */
  selectionStart: number | null;
  selectionEnd:   number | null;
  onPressDay:     (day: number) => void;
  /** Atalho: segurar num dia abre direto a confirmação de bloqueio de 1 dia. */
  onLongPressDay?: (day: number) => void;
};

// Grid mensal custom (sem lib de calendário — tokens do design system, mesmo
// racional dos arcos SVG custom): dias com show (booking confirmado) em teal,
// bloqueios/férias em coral, range em seleção com fundo brand.muted.
export function AgendaMonthGrid({ year, month, markers, selectionStart, selectionEnd, onPressDay, onLongPressDay }: Props) {
  const firstWeekday = new Date(year, month - 1, 1).getDay(); // 0 = domingo
  const daysInMonth  = new Date(year, month, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month - 1;

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const inSelection = (day: number) => {
    if (selectionStart === null) return false;
    const end = selectionEnd ?? selectionStart;
    return day >= Math.min(selectionStart, end) && day <= Math.max(selectionStart, end);
  };

  return (
    <View style={s.root}>
      <View style={s.weekRow}>
        {WEEKDAY_LABELS_SHORT.map((label, i) => (
          <Text key={i} style={s.weekLabel}>{label}</Text>
        ))}
      </View>

      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={s.weekRow}>
          {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
            if (day === null) return <View key={col} style={s.cell} />;

            const marker    = markers.get(day);
            const selected  = inSelection(day);
            const isToday   = isCurrentMonth && today.getDate() === day;

            return (
              <Pressable
                key={col}
                style={[s.cell, selected && s.cellSelected]}
                onPress={() => onPressDay(day)}
                onLongPress={onLongPressDay ? () => onLongPressDay(day) : undefined}
                accessibilityRole="button"
                accessibilityLabel={`Dia ${day}${marker?.hasBooking ? ', show marcado' : ''}${marker?.hasBlock ? ', bloqueado' : ''}`}
                accessibilityHint={onLongPressDay ? 'Toque pra selecionar; toque e segure pra bloquear só este dia' : undefined}
              >
                <View style={[s.dayWrap, isToday && s.dayToday]}>
                  <Text
                    style={[
                      s.dayText,
                      marker?.hasBlock && s.dayTextBlocked,
                      isToday && s.dayTextToday,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
                <View style={s.dotsRow}>
                  {marker?.hasBooking && <View style={[s.dot, { backgroundColor: colors.brand.primary }]} />}
                  {marker?.hasBlock && <View style={[s.dot, { backgroundColor: colors.accent.coral }]} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    gap: spacing.xs,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekLabel: {
    flex:       1,
    textAlign: 'center',
    ...typography.caption,
    fontFamily: 'Inter-Bold',
    color:      colors.text.muted,
  },
  cell: {
    flex:           1,
    minHeight:       48,
    alignItems:     'center',
    justifyContent: 'center',
    borderRadius:    radius.sm,
    gap:              2,
  },
  cellSelected: {
    backgroundColor: colors.brand.muted,
  },
  dayWrap: {
    width:           28,
    height:          28,
    borderRadius:    14,
    alignItems:     'center',
    justifyContent: 'center',
  },
  dayToday: {
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
  dayText: {
    ...typography.bodySm,
    fontFamily: 'Inter-Medium',
    color:      colors.text.primary,
  },
  dayTextBlocked: {
    color: colors.accent.coral,
  },
  dayTextToday: {
    color: colors.brand.primary,
  },
  dotsRow: {
    flexDirection: 'row',
    gap:            3,
    height:         4,
  },
  dot: {
    width:        4,
    height:       4,
    borderRadius: 2,
  },
});
