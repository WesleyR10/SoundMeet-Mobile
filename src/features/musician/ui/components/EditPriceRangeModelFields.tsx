import { View, Text, Pressable } from 'react-native';
import { useController, type Control } from 'react-hook-form';
import { Check } from 'lucide-react-native';
import { spacing, radius, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { FormField } from '@/shared/components/FormField';
import type { EditProfileFormValues } from '../../domain/musician.validation';

type PriceFieldName = 'priceHourMin' | 'priceHourMax' | 'priceHourNotes' | 'priceEventMin' | 'priceEventMax' | 'priceEventNotes';

type Props = {
  control:     Control<EditProfileFormValues>;
  label:       string;                                    // "Por hora" | "Por evento"
  unitSuffix:  string;                                    // "hora" | "evento"
  enabledName: 'priceHourEnabled' | 'priceEventEnabled';
  minName:     PriceFieldName;
  maxName:     PriceFieldName;
  notesName:   PriceFieldName;
};

// Bloco de UMA faixa de preço (modelo de cobrança) — toggle + min/max/notas.
// Cada modelo tem campos independentes no form (priceHour*/priceEvent*);
// desativar o toggle limpa os campos daquele modelo, sem afetar o outro.
const useStyles = makeStyles((colors) => ({
  root: {
    gap: spacing.md,
  },
  toggleChip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:                spacing.sm,
    minHeight:          48,
    paddingVertical:    spacing.md,
    paddingHorizontal:  spacing.lg,
    borderRadius:       radius.md,
    borderWidth:         1,
    borderColor:        colors.border.default,
    backgroundColor:    'rgba(255,255,255,0.03)',
  },
  toggleChipSelected: {
    borderColor:     colors.accent.amber,
    backgroundColor: 'rgba(245,158,11,0.12)',
  },
  checkBox: {
    width:           18,
    height:          18,
    borderRadius:    radius.sm / 2,
    borderWidth:      1.5,
    borderColor:     colors.border.strong,
    alignItems:     'center',
    justifyContent: 'center',
  },
  checkBoxSelected: {
    borderColor:     colors.accent.amber,
    backgroundColor: colors.accent.amber,
  },
  toggleText: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.secondary,
  },
  toggleTextSelected: {
    color: colors.accent.amber,
  },
  fields: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap:            spacing.md,
  },
  rowField: {
    flex: 1,
  },
}));

export function EditPriceRangeModelFields({
  control, label, unitSuffix, enabledName, minName, maxName, notesName,
}: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const { field: enabledField }                       = useController({ control, name: enabledName });
  const { field: minField,   fieldState: minState }   = useController({ control, name: minName });
  const { field: maxField,   fieldState: maxState }   = useController({ control, name: maxName });
  const { field: notesField, fieldState: notesState } = useController({ control, name: notesName });

  const enabled = !!enabledField.value;

  const handleToggle = () => {
    const next = !enabled;
    enabledField.onChange(next);
    if (!next) {
      minField.onChange('');
      maxField.onChange('');
      notesField.onChange('');
    }
  };

  return (
    <View style={s.root}>
      <Pressable
        onPress={handleToggle}
        style={[s.toggleChip, enabled && s.toggleChipSelected]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: enabled }}
        accessibilityLabel={`Cobrar ${label.toLowerCase()}`}
      >
        <View style={[s.checkBox, enabled && s.checkBoxSelected]}>
          {enabled && <Check size={12} color={colors.text.inverse} strokeWidth={3} />}
        </View>
        <Text style={[s.toggleText, enabled && s.toggleTextSelected]}>{label}</Text>
      </Pressable>

      {enabled && (
        <View style={s.fields}>
          <View style={s.row}>
            <View style={s.rowField}>
              <FormField
                label={`A partir de (R$/${unitSuffix})`}
                value={String(minField.value ?? '')}
                onChangeText={(v) => minField.onChange(v.replace(/[^0-9.]/g, ''))}
                onBlur={minField.onBlur}
                placeholder="0"
                keyboardType="decimal-pad"
                error={minState.error?.message}
              />
            </View>
            <View style={s.rowField}>
              <FormField
                label={`Até (R$/${unitSuffix})`}
                value={String(maxField.value ?? '')}
                onChangeText={(v) => maxField.onChange(v.replace(/[^0-9.]/g, ''))}
                onBlur={maxField.onBlur}
                placeholder="0"
                keyboardType="decimal-pad"
                error={maxState.error?.message}
              />
            </View>
          </View>

          <FormField
            label="Notas (opcional)"
            value={String(notesField.value ?? '')}
            onChangeText={notesField.onChange}
            onBlur={notesField.onBlur}
            placeholder="Ex.: inclui equipamento de som"
            autoCapitalize="sentences"
            error={notesState.error?.message}
          />
        </View>
      )}
    </View>
  );
}
