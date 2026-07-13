import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Controller, type Control } from 'react-hook-form';
import { colors, spacing, radius, typography } from '@/shared/design-system/tokens';
import { FormField } from '@/shared/components/FormField';
import type { EditProfileFormValues } from '../../domain/musician.validation';
import type { PriceRangeModel } from '../../domain/musician.types';

type Props = {
  control: Control<EditProfileFormValues>;
};

const MODEL_LABEL: Record<PriceRangeModel, string> = {
  per_hour:  'Por hora',
  per_event: 'Por evento',
};

// Expõe o contrato completo de PriceRangeInput do backend (model + min + max +
// notes) — decisão confirmada com o usuário em vez de simplificar para um único
// campo "valor/hora" como no mockup de referência.
export function EditPriceRangeSection({ control }: Props) {
  return (
    <Controller
      control={control}
      name="priceModel"
      render={({ field: modelField }) => (
        <View style={s.root}>
          <View style={s.header}>
            <Text style={s.label}>Faixa de preço</Text>
            <Text style={s.optional}>OPCIONAL</Text>
          </View>

          <View style={s.modelRow}>
            {(Object.keys(MODEL_LABEL) as PriceRangeModel[]).map((model) => {
              const selected = modelField.value === model;
              return (
                <Pressable
                  key={model}
                  onPress={() => modelField.onChange(selected ? null : model)}
                  style={[s.modelChip, selected && s.modelChipSelected]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text style={[s.modelChipText, selected && s.modelChipTextSelected]}>{MODEL_LABEL[model]}</Text>
                </Pressable>
              );
            })}
          </View>

          {modelField.value && (
            <View style={s.fields}>
              <View style={s.row}>
                <Controller
                  control={control}
                  name="priceMin"
                  render={({ field, fieldState }) => (
                    <View style={s.rowField}>
                      <FormField
                        label={`Mínimo (${MODEL_LABEL[modelField.value as PriceRangeModel]})`}
                        value={field.value}
                        onChangeText={(v) => field.onChange(v.replace(/[^0-9.]/g, ''))}
                        onBlur={field.onBlur}
                        placeholder="0"
                        keyboardType="decimal-pad"
                        error={fieldState.error?.message}
                      />
                    </View>
                  )}
                />
                <Controller
                  control={control}
                  name="priceMax"
                  render={({ field, fieldState }) => (
                    <View style={s.rowField}>
                      <FormField
                        label="Máximo"
                        value={field.value}
                        onChangeText={(v) => field.onChange(v.replace(/[^0-9.]/g, ''))}
                        onBlur={field.onBlur}
                        placeholder="0"
                        keyboardType="decimal-pad"
                        error={fieldState.error?.message}
                      />
                    </View>
                  )}
                />
              </View>

              <Controller
                control={control}
                name="priceNotes"
                render={({ field, fieldState }) => (
                  <FormField
                    label="Notas (opcional)"
                    value={field.value ?? ''}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Ex.: inclui equipamento de som"
                    autoCapitalize="sentences"
                    error={fieldState.error?.message}
                  />
                )}
              />
            </View>
          )}
        </View>
      )}
    />
  );
}

const s = StyleSheet.create({
  root: {
    gap: spacing.md,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'baseline',
    gap:             spacing.sm,
  },
  label: {
    ...typography.caption,
    fontFamily:    'Inter-Bold',
    letterSpacing:  0.6,
    color:          colors.accent.amber,
    textTransform:  'uppercase',
  },
  optional: {
    ...typography.caption,
    color: 'rgba(245,158,11,0.6)',
  },
  modelRow: {
    flexDirection: 'row',
    gap:            spacing.sm,
  },
  modelChip: {
    flex:               1,
    alignItems:        'center',
    paddingVertical:    spacing.md,
    borderRadius:       radius.md,
    borderWidth:         1,
    borderColor:        colors.border.default,
    backgroundColor:    'rgba(255,255,255,0.03)',
  },
  modelChipSelected: {
    borderColor:     colors.accent.amber,
    backgroundColor: 'rgba(245,158,11,0.12)',
  },
  modelChipText: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.secondary,
  },
  modelChipTextSelected: {
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
});
