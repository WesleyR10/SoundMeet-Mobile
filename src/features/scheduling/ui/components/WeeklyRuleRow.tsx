import { View, Text, Switch, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { FormField } from '@/shared/components/FormField';

export type WeekdayDraft = {
  enabled:    boolean;
  start_time: string; // HH:MM (mascarado)
  end_time:   string;
};

type Props = {
  label:    string;
  draft:    WeekdayDraft;
  error?:   string;
  onChange: (draft: WeekdayDraft) => void;
};

/** Máscara HH:MM conforme digita (teclado numérico, sem datepicker nativo). */
export function formatTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

/** Valida HH:MM (00-23:00-59). */
export function isValidTime(value: string): boolean {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return false;
  return Number(match[1]) < 24 && Number(match[2]) < 60;
}

// Uma linha da disponibilidade semanal: toggle do dia + janela início/fim.
// v1 = uma janela por dia (o backend aceita várias; UI evolui se precisar).
export function WeeklyRuleRow({ label, draft, error, onChange }: Props) {
  return (
    <View style={[s.root, draft.enabled && s.rootEnabled]}>
      <View style={s.headerRow}>
        <Text style={[s.day, draft.enabled && s.dayEnabled]}>{label}</Text>
        <Switch
          value={draft.enabled}
          onValueChange={(enabled) => onChange({ ...draft, enabled })}
          trackColor={{ false: colors.border.default, true: colors.brand.muted }}
          thumbColor={draft.enabled ? colors.brand.primary : colors.text.muted}
          accessibilityLabel={`Disponível ${label}`}
        />
      </View>

      {draft.enabled && (
        <View style={s.timesRow}>
          <View style={s.timeField}>
            <FormField
              label="Das"
              value={draft.start_time}
              onChangeText={(v) => onChange({ ...draft, start_time: formatTimeInput(v) })}
              placeholder="18:00"
              keyboardType="number-pad"
            />
          </View>
          <View style={s.timeField}>
            <FormField
              label="Até"
              value={draft.end_time}
              onChangeText={(v) => onChange({ ...draft, end_time: formatTimeInput(v) })}
              placeholder="23:59"
              keyboardType="number-pad"
            />
          </View>
        </View>
      )}

      {!!error && <Text style={s.error}>{error}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    gap:               spacing.md,
    padding:           spacing.lg,
    borderRadius:      radius.md,
    borderWidth:        1,
    borderColor:       colors.border.default,
    backgroundColor:   'rgba(255,255,255,0.03)',
  },
  rootEnabled: {
    borderColor: colors.border.brand,
  },
  headerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  day: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.secondary,
  },
  dayEnabled: {
    color: colors.text.primary,
  },
  timesRow: {
    flexDirection: 'row',
    gap:            spacing.md,
  },
  timeField: {
    flex: 1,
  },
  error: {
    ...typography.bodySm,
    color: colors.status.error,
  },
});
